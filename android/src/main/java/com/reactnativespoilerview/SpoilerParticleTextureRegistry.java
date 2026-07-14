package com.reactnativespoilerview;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Process;
import android.os.SystemClock;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.WeakHashMap;

/**
 * Produces a small set of animated alpha textures shared by every attached
 * spoiler view. The default configuration therefore pays particle simulation
 * and rasterization once per process tick instead of once per mounted spoiler.
 */
final class SpoilerParticleTextureRegistry {
  private static final long FRAME_DELAY_MILLIS = 33L;
  private static final int MAX_CACHED_TEXTURES = 6;
  private static final int TEXTURE_SIZE_DP = 96;
  private static final int SIZE_BUCKET_COUNT = 3;
  private static final int ALPHA_BUCKET_COUNT = 8;
  private static final int BUCKET_COUNT = SIZE_BUCKET_COUNT * ALPHA_BUCKET_COUNT;
  private static final float TWO_PI = (float) (Math.PI * 2.0);

  private static SpoilerParticleTextureRegistry instance;

  static synchronized SpoilerParticleTextureRegistry getInstance(Context context) {
    if (instance == null) {
      instance = new SpoilerParticleTextureRegistry(context.getApplicationContext());
    }
    return instance;
  }

  static final class TextureKey {
    final int densityTenThousandths;
    final int minimumSizeHundredths;
    final int maximumSizeHundredths;
    final int driftHundredths;
    final int speedHundredths;

    private TextureKey(
        int densityTenThousandths,
        int minimumSizeHundredths,
        int maximumSizeHundredths,
        int driftHundredths,
        int speedHundredths) {
      this.densityTenThousandths = densityTenThousandths;
      this.minimumSizeHundredths = minimumSizeHundredths;
      this.maximumSizeHundredths = maximumSizeHundredths;
      this.driftHundredths = driftHundredths;
      this.speedHundredths = speedHundredths;
    }

    static TextureKey create(
        int particleCount,
        float logicalWidth,
        float logicalHeight,
        float minimumSize,
        float maximumSize,
        float driftAmount,
        float noiseSpeed) {
      float area = Math.max(1f, logicalWidth * logicalHeight);
      float requestedDensity = particleCount / area;
      int densityTenThousandths = Math.max(
          1,
          quantize(
              Math.round(Math.max(0.0001f, Math.min(0.12f, requestedDensity)) * 10000f),
              5));
      return new TextureKey(
          densityTenThousandths,
          quantize(Math.round(minimumSize * 100f), 5),
          quantize(Math.round(maximumSize * 100f), 5),
          quantize(Math.round(driftAmount * 100f), 10),
          quantize(Math.round(noiseSpeed * 100f), 5));
    }

    private static int quantize(int value, int step) {
      return Math.round(value / (float) step) * step;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) return true;
      if (!(other instanceof TextureKey)) return false;
      TextureKey key = (TextureKey) other;
      return densityTenThousandths == key.densityTenThousandths
          && minimumSizeHundredths == key.minimumSizeHundredths
          && maximumSizeHundredths == key.maximumSizeHundredths
          && driftHundredths == key.driftHundredths
          && speedHundredths == key.speedHundredths;
    }

    @Override
    public int hashCode() {
      int result = densityTenThousandths;
      result = 31 * result + minimumSizeHundredths;
      result = 31 * result + maximumSizeHundredths;
      result = 31 * result + driftHundredths;
      result = 31 * result + speedHundredths;
      return result;
    }
  }

  private static final class Registration {
    TextureState state;
    boolean animated;

    Registration(TextureState state, boolean animated) {
      this.state = state;
      this.animated = animated;
    }
  }

  private static final class Particle {
    float baseX;
    float baseY;
    float directionX;
    float directionY;
    float phase;
    float lifetime;
    float tier;
    int sizeBucket;
  }

  private static final class TextureState {
    final TextureKey key;
    final float displayDensity;
    final int sizePixels;
    final Particle[] particles;
    final float[][] pointBuckets;
    final int[] bucketPointCounts = new int[BUCKET_COUNT];
    final Bitmap[] buffers = new Bitmap[2];
    final Paint particlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    volatile Bitmap frontBitmap;
    int writeBufferIndex;
    long lastUsedMillis;
    boolean needsInitialFrame = true;

    TextureState(TextureKey key, float displayDensity) {
      this.key = key;
      this.displayDensity = displayDensity;
      sizePixels = Math.max(64, Math.round(TEXTURE_SIZE_DP * displayDensity));
      float requestedDensity = key.densityTenThousandths / 10000f;
      int particleCount = Math.max(
          1,
          Math.min(600, Math.round(requestedDensity * TEXTURE_SIZE_DP * TEXTURE_SIZE_DP)));
      particles = createParticles(key, particleCount);
      pointBuckets = new float[BUCKET_COUNT][particleCount * 2];
      particlePaint.setStrokeCap(Paint.Cap.ROUND);
      lastUsedMillis = SystemClock.uptimeMillis();
    }

    private static Particle[] createParticles(TextureKey key, int count) {
      Particle[] particles = new Particle[count];
      SpoilerRandom random = new SpoilerRandom(key.hashCode() ^ 0x51f15e);
      float minimumSize = key.minimumSizeHundredths / 100f;
      float maximumSize = Math.max(minimumSize, key.maximumSizeHundredths / 100f);
      float padding = maximumSize + 2f;
      float innerSize = Math.max(1f, TEXTURE_SIZE_DP - padding * 2f);

      for (int index = 0; index < count; index += 1) {
        float angle = random.nextFloat() * TWO_PI;
        Particle particle = new Particle();
        particle.baseX = padding + random.nextFloat() * innerSize;
        particle.baseY = padding + random.nextFloat() * innerSize;
        particle.directionX = (float) Math.cos(angle);
        particle.directionY = (float) Math.sin(angle);
        particle.phase = random.nextFloat();
        particle.lifetime = 1f + random.nextFloat() * 2f;
        float tierSeed = random.nextFloat();
        particle.tier = tierSeed < 1f / 3f ? 0.3f : (tierSeed < 2f / 3f ? 0.6f : 1f);
        float size = minimumSize + random.nextFloat() * (maximumSize - minimumSize);
        float sizeFraction = maximumSize == minimumSize
            ? 0f
            : (size - minimumSize) / (maximumSize - minimumSize);
        particle.sizeBucket = Math.min(
            SIZE_BUCKET_COUNT - 1,
            Math.max(0, Math.round(sizeFraction * (SIZE_BUCKET_COUNT - 1))));
        particles[index] = particle;
      }
      return particles;
    }

    void render(long frameTimeNanos) {
      if (buffers[writeBufferIndex] == null) {
        buffers[writeBufferIndex] = Bitmap.createBitmap(
            sizePixels,
            sizePixels,
            Bitmap.Config.ALPHA_8);
      }
      Bitmap target = buffers[writeBufferIndex];
      target.eraseColor(Color.TRANSPARENT);
      Canvas canvas = new Canvas(target);
      fillPointBuckets(frameTimeNanos / 1_000_000_000f);

      float minimumSize = key.minimumSizeHundredths / 100f;
      float maximumSize = Math.max(minimumSize, key.maximumSizeHundredths / 100f);
      particlePaint.setColor(Color.WHITE);
      for (int sizeBucket = 0; sizeBucket < SIZE_BUCKET_COUNT; sizeBucket += 1) {
        float sizeFraction = sizeBucket / (float) (SIZE_BUCKET_COUNT - 1);
        float radius = minimumSize + (maximumSize - minimumSize) * sizeFraction;
        particlePaint.setStrokeWidth(Math.max(1f, radius * displayDensity * 2f));
        for (int alphaBucket = 1; alphaBucket < ALPHA_BUCKET_COUNT; alphaBucket += 1) {
          int bucket = sizeBucket * ALPHA_BUCKET_COUNT + alphaBucket;
          int pointCount = bucketPointCounts[bucket];
          if (pointCount == 0) continue;
          particlePaint.setAlpha(Math.round(
              255f * alphaBucket / (float) (ALPHA_BUCKET_COUNT - 1)));
          canvas.drawPoints(pointBuckets[bucket], 0, pointCount * 2, particlePaint);
        }
      }

      target.prepareToDraw();
      frontBitmap = target;
      writeBufferIndex = (writeBufferIndex + 1) % buffers.length;
      needsInitialFrame = false;
    }

    private void fillPointBuckets(float time) {
      for (int index = 0; index < bucketPointCounts.length; index += 1) {
        bucketPointCounts[index] = 0;
      }
      float drift = key.driftHundredths / 100f;
      float speed = key.speedHundredths / 100f;

      for (Particle particle : particles) {
        float age = fract(time / particle.lifetime + particle.phase);
        float movement = (float) Math.sin(time * speed * 4f + particle.phase * TWO_PI);
        float centerX = wrap(particle.baseX + particle.directionX * movement * drift);
        float centerY = wrap(particle.baseY + particle.directionY * movement * drift);
        float birth = Math.min(1f, age / 0.08f);
        float death = Math.min(1f, (1f - age) / 0.18f);
        float alpha = particle.tier * birth * death;
        if (alpha <= 0.01f) continue;

        int alphaBucket = Math.min(
            ALPHA_BUCKET_COUNT - 1,
            Math.max(0, Math.round(alpha * (ALPHA_BUCKET_COUNT - 1))));
        if (alphaBucket == 0) continue;
        int bucket = particle.sizeBucket * ALPHA_BUCKET_COUNT + alphaBucket;
        int pointIndex = bucketPointCounts[bucket];
        pointBuckets[bucket][pointIndex * 2] = centerX * displayDensity;
        pointBuckets[bucket][pointIndex * 2 + 1] = centerY * displayDensity;
        bucketPointCounts[bucket] = pointIndex + 1;
      }
    }

    private static float wrap(float value) {
      float result = value % TEXTURE_SIZE_DP;
      return result < 0 ? result + TEXTURE_SIZE_DP : result;
    }

    private static float fract(float value) {
      return value - (float) Math.floor(value);
    }
  }

  private final Object lock = new Object();
  private final float displayDensity;
  private final Handler workerHandler;
  private final Map<TextureKey, TextureState> textures = new HashMap<>();
  private final WeakHashMap<SpoilerParticleView, Registration> registrations =
      new WeakHashMap<>();
  private boolean frameScheduled;

  private final Runnable frameRunnable = new Runnable() {
    @Override
    public void run() {
      ArrayList<TextureState> statesToRender = new ArrayList<>();
      ArrayList<WeakReference<SpoilerParticleView>> viewsToInvalidate = new ArrayList<>();
      boolean shouldContinue = false;

      synchronized (lock) {
        frameScheduled = false;
        for (Map.Entry<SpoilerParticleView, Registration> entry : registrations.entrySet()) {
          SpoilerParticleView view = entry.getKey();
          if (view == null) continue;
          Registration registration = entry.getValue();
          if (registration.animated) shouldContinue = true;
          if (registration.animated || registration.state.needsInitialFrame) {
            if (!statesToRender.contains(registration.state)) {
              statesToRender.add(registration.state);
            }
            viewsToInvalidate.add(new WeakReference<>(view));
          }
        }
      }

      long frameTimeNanos = System.nanoTime();
      for (TextureState state : statesToRender) state.render(frameTimeNanos);
      for (WeakReference<SpoilerParticleView> reference : viewsToInvalidate) {
        SpoilerParticleView view = reference.get();
        if (view != null) view.postInvalidateOnAnimation();
      }

      synchronized (lock) {
        if (shouldContinue && !frameScheduled) {
          frameScheduled = true;
          workerHandler.postDelayed(this, FRAME_DELAY_MILLIS);
        }
      }
    }
  };

  private SpoilerParticleTextureRegistry(Context context) {
    displayDensity = context.getResources().getDisplayMetrics().density;
    HandlerThread workerThread = new HandlerThread(
        "SpoilerParticleTexture",
        Process.THREAD_PRIORITY_BACKGROUND);
    workerThread.start();
    workerHandler = new Handler(workerThread.getLooper());
  }

  void register(SpoilerParticleView view, TextureKey key, boolean animated) {
    synchronized (lock) {
      TextureState state = textures.get(key);
      if (state == null) {
        state = new TextureState(key, displayDensity);
        textures.put(key, state);
        pruneUnusedTexturesLocked();
      }
      state.lastUsedMillis = SystemClock.uptimeMillis();
      registrations.put(view, new Registration(state, animated));
      scheduleFrameLocked();
    }
  }

  void unregister(SpoilerParticleView view) {
    synchronized (lock) {
      registrations.remove(view);
    }
  }

  Bitmap getBitmap(SpoilerParticleView view) {
    synchronized (lock) {
      Registration registration = registrations.get(view);
      return registration == null ? null : registration.state.frontBitmap;
    }
  }

  private void scheduleFrameLocked() {
    if (!frameScheduled) {
      frameScheduled = true;
      workerHandler.post(frameRunnable);
    }
  }

  private void pruneUnusedTexturesLocked() {
    if (textures.size() <= MAX_CACHED_TEXTURES) return;
    TextureState oldest = null;
    for (TextureState state : textures.values()) {
      boolean inUse = false;
      for (Registration registration : registrations.values()) {
        if (registration.state == state) {
          inUse = true;
          break;
        }
      }
      if (!inUse && (oldest == null || state.lastUsedMillis < oldest.lastUsedMillis)) {
        oldest = state;
      }
    }
    if (oldest != null) {
      Iterator<Map.Entry<TextureKey, TextureState>> iterator = textures.entrySet().iterator();
      while (iterator.hasNext()) {
        if (iterator.next().getValue() == oldest) {
          iterator.remove();
          break;
        }
      }
      // The render worker or a hardware Canvas can still be reading the last
      // published buffer here. Let GC reclaim it after both threads release it.
    }
  }
}
