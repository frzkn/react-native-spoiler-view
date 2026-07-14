package com.reactnativespoilerview;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Shader;
import android.view.Choreographer;
import android.view.View;

final class SpoilerParticleView extends View {
  // Reveal is short-lived and per-view. Ambient particle work lives in the
  // process-wide texture registry instead.
  private static final int SIZE_BUCKET_COUNT = 5;
  private static final int ALPHA_BUCKET_COUNT = 8;
  private static final int BUCKET_COUNT = SIZE_BUCKET_COUNT * ALPHA_BUCKET_COUNT;
  private static final float TWO_PI = (float) (Math.PI * 2.0);
  private static final float REVEAL_DISPERSAL_SPEED = 150f;

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

  private final Paint overlayPaint = new Paint();
  private final Paint particlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
  private final Matrix shaderMatrix = new Matrix();
  private final SpoilerParticleTextureRegistry textureRegistry;
  private final Choreographer.FrameCallback frameCallback;

  private float originX = 0.5f;
  private float originY = 0.5f;
  private float progress;
  private int particleCount = 180;
  private int seed = 1;
  private int particleColor = Color.rgb(80, 80, 80);
  private int overlayColor = Color.TRANSPARENT;
  private float minimumSize = 0.45f;
  private float maximumSize = 0.8f;
  private float driftAmount = 1f;
  private float noiseSpeed = 0.3f;
  private float revealDuration = 500f;
  private boolean reduceMotion;
  private boolean frameCallbackPosted;
  private long animationStartNanos;
  private float animationTimeSeconds;
  private Particle[] particles = new Particle[0];
  private float[][] pointBuckets = new float[BUCKET_COUNT][0];
  private final int[] bucketPointCounts = new int[BUCKET_COUNT];
  private Bitmap shaderBitmap;
  private BitmapShader ambientShader;

  SpoilerParticleView(Context context) {
    super(context);
    textureRegistry = SpoilerParticleTextureRegistry.getInstance(context);
    frameCallback = frameTimeNanos -> {
      frameCallbackPosted = false;
      if (!shouldAnimateReveal()) return;
      if (animationStartNanos == 0L) animationStartNanos = frameTimeNanos;
      animationTimeSeconds = (frameTimeNanos - animationStartNanos) / 1_000_000_000f;
      invalidate();
      scheduleFrame();
    };
    setWillNotDraw(false);
    setLayerType(LAYER_TYPE_NONE, null);
    particlePaint.setStrokeCap(Paint.Cap.ROUND);
  }

  void setOriginX(float value) {
    originX = clamp(value);
    invalidate();
  }

  void setOriginY(float value) {
    originY = clamp(value);
    invalidate();
  }

  void setProgress(float value) {
    float previous = progress;
    progress = clamp(value);
    if ((previous <= 0.001f && progress > 0.001f)
        || (previous >= 0.999f && progress < 0.999f)) {
      animationStartNanos = 0L;
      animationTimeSeconds = 0f;
    }
    updateTextureRegistration();
    invalidate();
    restartRevealTicker();
  }

  void setParticleCount(int value) {
    int nextCount = Math.max(0, Math.min(1000, value));
    if (particleCount == nextCount) return;
    particleCount = nextCount;
    rebuildParticles();
    updateTextureRegistration();
  }

  void setSeed(int value) {
    if (seed == value) return;
    seed = value;
    shaderBitmap = null;
    ambientShader = null;
    rebuildParticles();
  }

  void setParticleColor(int value) {
    if (particleColor == value) return;
    particleColor = value;
    updateTextureRegistration();
    invalidate();
  }

  void setOverlayColor(int value) {
    overlayColor = value;
    invalidate();
  }

  void setMinimumSize(float value) {
    float nextSize = Math.max(0f, value);
    if (minimumSize == nextSize) return;
    minimumSize = nextSize;
    maximumSize = Math.max(maximumSize, minimumSize);
    rebuildParticles();
    updateTextureRegistration();
  }

  void setMaximumSize(float value) {
    float nextSize = Math.max(minimumSize, value);
    if (maximumSize == nextSize) return;
    maximumSize = nextSize;
    rebuildParticles();
    updateTextureRegistration();
  }

  void setDriftAmount(float value) {
    float nextValue = Math.max(0f, value);
    if (driftAmount == nextValue) return;
    driftAmount = nextValue;
    updateTextureRegistration();
  }

  void setNoiseSpeed(float value) {
    float nextValue = Math.max(0f, value);
    if (noiseSpeed == nextValue) return;
    noiseSpeed = nextValue;
    updateTextureRegistration();
  }

  void setRevealDuration(float value) {
    revealDuration = Math.max(0f, value);
  }

  void setReduceMotion(boolean value) {
    if (reduceMotion == value) return;
    reduceMotion = value;
    updateTextureRegistration();
    restartRevealTicker();
    invalidate();
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    rebuildParticles();
    updateTextureRegistration();
    restartRevealTicker();
  }

  @Override
  protected void onDetachedFromWindow() {
    textureRegistry.unregister(this);
    stopTicker();
    particles = new Particle[0];
    pointBuckets = new float[BUCKET_COUNT][0];
    shaderBitmap = null;
    ambientShader = null;
    super.onDetachedFromWindow();
  }

  @Override
  protected void onSizeChanged(int width, int height, int oldWidth, int oldHeight) {
    super.onSizeChanged(width, height, oldWidth, oldHeight);
    rebuildParticles();
    updateTextureRegistration();
  }

  @Override
  protected void onWindowVisibilityChanged(int visibility) {
    super.onWindowVisibilityChanged(visibility);
    updateTextureRegistration();
    restartRevealTicker();
  }

  @Override
  protected void onVisibilityChanged(View changedView, int visibility) {
    super.onVisibilityChanged(changedView, visibility);
    updateTextureRegistration();
    restartRevealTicker();
  }

  @Override
  protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);
    if (getWidth() <= 0 || getHeight() <= 0 || progress >= 0.999f) return;

    if (Color.alpha(overlayColor) > 0) {
      overlayPaint.setColor(overlayColor);
      overlayPaint.setAlpha(Math.round(Color.alpha(overlayColor) * (1f - progress)));
      canvas.drawRect(0f, 0f, getWidth(), getHeight(), overlayPaint);
    }

    if (particleCount <= 0 || maximumSize <= 0f || Color.alpha(particleColor) == 0) return;
    if (progress <= 0.001f) {
      drawAmbientTexture(canvas);
    } else {
      drawRevealParticles(canvas);
    }
  }

  private void drawAmbientTexture(Canvas canvas) {
    Bitmap bitmap = textureRegistry.getBitmap(this);
    if (bitmap == null || bitmap.isRecycled()) return;
    if (bitmap != shaderBitmap) {
      shaderBitmap = bitmap;
      ambientShader = new BitmapShader(bitmap, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT);
      int offsetX = Math.floorMod(seed * 37, Math.max(1, bitmap.getWidth()));
      int offsetY = Math.floorMod(seed * 53, Math.max(1, bitmap.getHeight()));
      shaderMatrix.setTranslate(offsetX, offsetY);
      ambientShader.setLocalMatrix(shaderMatrix);
    }
    particlePaint.setShader(ambientShader);
    particlePaint.setColor(particleColor);
    canvas.drawRect(0f, 0f, getWidth(), getHeight(), particlePaint);
    particlePaint.setShader(null);
  }

  private void drawRevealParticles(Canvas canvas) {
    if (particles.length == 0) return;
    fillPointBuckets();
    float density = getResources().getDisplayMetrics().density;
    particlePaint.setColor(Color.rgb(
        Color.red(particleColor),
        Color.green(particleColor),
        Color.blue(particleColor)));

    for (int sizeBucket = 0; sizeBucket < SIZE_BUCKET_COUNT; sizeBucket += 1) {
      float sizeFraction = sizeBucket / (float) (SIZE_BUCKET_COUNT - 1);
      float radius = minimumSize + (maximumSize - minimumSize) * sizeFraction;
      particlePaint.setStrokeWidth(Math.max(1f, radius * density * 2f));
      for (int alphaBucket = 0; alphaBucket < ALPHA_BUCKET_COUNT; alphaBucket += 1) {
        int bucket = sizeBucket * ALPHA_BUCKET_COUNT + alphaBucket;
        int pointCount = bucketPointCounts[bucket];
        if (pointCount == 0) continue;
        float alphaFraction = alphaBucket / (float) (ALPHA_BUCKET_COUNT - 1);
        particlePaint.setAlpha(Math.round(Color.alpha(particleColor) * alphaFraction));
        canvas.drawPoints(pointBuckets[bucket], 0, pointCount * 2, particlePaint);
      }
    }
  }

  private void fillPointBuckets() {
    for (int index = 0; index < bucketPointCounts.length; index += 1) {
      bucketPointCounts[index] = 0;
    }

    float density = getResources().getDisplayMetrics().density;
    float logicalWidth = getWidth() / density;
    float logicalHeight = getHeight() / density;
    float time = isMotionReduced() ? 0f : animationTimeSeconds;
    float revealX = logicalWidth * originX;
    float revealY = logicalHeight * originY;
    float dispersalDistance = Math.min(
        REVEAL_DISPERSAL_SPEED * revealDuration / 1000f,
        (float) Math.hypot(logicalWidth, logicalHeight) * 2f) * progress;
    float revealRadius = progress * (float) Math.hypot(logicalWidth, logicalHeight);

    for (Particle particle : particles) {
      float age = fract(time / particle.lifetime + particle.phase);
      float movement = (float) Math.sin(time * noiseSpeed * 4f + particle.phase * TWO_PI);
      float centerX = particle.baseX + particle.directionX * movement * driftAmount;
      float centerY = particle.baseY + particle.directionY * movement * driftAmount;
      float deltaX = centerX - revealX;
      float deltaY = centerY - revealY;
      float originDistance = (float) Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (originDistance > 0.001f) {
        float distanceFactor = 0.55f + 0.45f * clamp(1f - originDistance / 200f);
        float dispersal = dispersalDistance * distanceFactor / originDistance;
        centerX += deltaX * dispersal;
        centerY += deltaY * dispersal;
        deltaX = centerX - revealX;
        deltaY = centerY - revealY;
        originDistance = (float) Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      }

      float birth = Math.min(1f, age / 0.08f);
      float death = Math.min(1f, (1f - age) / 0.18f);
      float revealMask = smoothstep(revealRadius - 2f, revealRadius + 2f, originDistance);
      float alpha = particle.tier * birth * death * revealMask;
      if (alpha <= 0.01f) continue;

      int alphaBucket = Math.min(
          ALPHA_BUCKET_COUNT - 1,
          Math.max(0, Math.round(alpha * (ALPHA_BUCKET_COUNT - 1))));
      int bucket = particle.sizeBucket * ALPHA_BUCKET_COUNT + alphaBucket;
      int pointIndex = bucketPointCounts[bucket];
      pointBuckets[bucket][pointIndex * 2] = centerX * density;
      pointBuckets[bucket][pointIndex * 2 + 1] = centerY * density;
      bucketPointCounts[bucket] = pointIndex + 1;
    }
  }

  private void rebuildParticles() {
    if (getWidth() <= 0 || getHeight() <= 0 || particleCount <= 0) {
      particles = new Particle[0];
      pointBuckets = new float[BUCKET_COUNT][0];
      invalidate();
      return;
    }

    float density = getResources().getDisplayMetrics().density;
    float logicalWidth = getWidth() / density;
    float logicalHeight = getHeight() / density;
    particles = new Particle[particleCount];
    SpoilerRandom random = new SpoilerRandom(seed);
    float padding = maximumSize + 2f;
    float innerWidth = Math.max(1f, logicalWidth - padding * 2f);
    float innerHeight = Math.max(1f, logicalHeight - padding * 2f);

    for (int index = 0; index < particleCount; index += 1) {
      float angle = random.nextFloat() * TWO_PI;
      random.nextFloat();
      Particle particle = new Particle();
      float tierSeed = random.nextFloat();
      particle.tier = tierSeed < 1f / 3f ? 0.3f : (tierSeed < 2f / 3f ? 0.6f : 1f);
      particle.baseX = padding + random.nextFloat() * innerWidth;
      particle.baseY = padding + random.nextFloat() * innerHeight;
      random.nextFloat();
      random.nextFloat();
      particle.phase = random.nextFloat();
      particle.lifetime = 1f + random.nextFloat() * 2f;
      float size = minimumSize + random.nextFloat() * (maximumSize - minimumSize);
      float sizeFraction = maximumSize == minimumSize
          ? 0f
          : (size - minimumSize) / (maximumSize - minimumSize);
      particle.sizeBucket = Math.min(
          SIZE_BUCKET_COUNT - 1,
          Math.max(0, Math.round(sizeFraction * (SIZE_BUCKET_COUNT - 1))));
      particle.directionX = (float) Math.cos(angle);
      particle.directionY = (float) Math.sin(angle);
      particles[index] = particle;
    }

    pointBuckets = new float[BUCKET_COUNT][particles.length * 2];
    invalidate();
  }

  private void updateTextureRegistration() {
    if (!isAttachedToWindow()
        || getWidth() <= 0
        || getHeight() <= 0
        || particleCount <= 0
        || maximumSize <= 0f
        || Color.alpha(particleColor) == 0
        || progress > 0.001f
        || getWindowVisibility() != VISIBLE
        || !isShown()) {
      textureRegistry.unregister(this);
      shaderBitmap = null;
      ambientShader = null;
      return;
    }

    float density = getResources().getDisplayMetrics().density;
    SpoilerParticleTextureRegistry.TextureKey key =
        SpoilerParticleTextureRegistry.TextureKey.create(
            particleCount,
            getWidth() / density,
            getHeight() / density,
            minimumSize,
            maximumSize,
            driftAmount,
            noiseSpeed);
    textureRegistry.register(this, key, !isMotionReduced());
  }

  private void restartRevealTicker() {
    stopTicker();
    if (shouldAnimateReveal()) scheduleFrame();
  }

  private void scheduleFrame() {
    if (!frameCallbackPosted) {
      frameCallbackPosted = true;
      Choreographer.getInstance().postFrameCallback(frameCallback);
    }
  }

  private void stopTicker() {
    if (frameCallbackPosted) {
      Choreographer.getInstance().removeFrameCallback(frameCallback);
      frameCallbackPosted = false;
    }
  }

  private boolean shouldAnimateReveal() {
    return !isMotionReduced()
        && particles.length > 0
        && maximumSize > 0f
        && Color.alpha(particleColor) > 0
        && progress > 0.001f
        && progress < 0.999f
        && isAttachedToWindow()
        && getWindowVisibility() == VISIBLE
        && isShown();
  }

  private boolean isMotionReduced() {
    return reduceMotion || ValueAnimator.getDurationScale() == 0f;
  }

  private static float smoothstep(float edge0, float edge1, float value) {
    if (edge0 == edge1) return value < edge0 ? 0f : 1f;
    float normalized = clamp((value - edge0) / (edge1 - edge0));
    return normalized * normalized * (3f - 2f * normalized);
  }

  private static float fract(float value) {
    return value - (float) Math.floor(value);
  }

  private static float clamp(float value) {
    return Math.max(0f, Math.min(1f, value));
  }
}
