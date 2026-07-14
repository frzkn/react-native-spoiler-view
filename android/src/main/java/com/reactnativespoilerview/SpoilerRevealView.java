package com.reactnativespoilerview;

import android.content.Context;
import android.graphics.Outline;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewOutlineProvider;
import com.facebook.react.views.view.ReactViewGroup;

final class SpoilerRevealView extends ReactViewGroup {
  private float originX = 0.5f;
  private float originY = 0.5f;
  private float progress = 0f;
  private boolean hiding;

  SpoilerRevealView(Context context) {
    super(context);
    setOutlineProvider(new RevealOutlineProvider());
    updateClipping();
  }

  void setOriginX(float value) {
    originX = clamp(value);
    invalidateOutline();
  }

  void setOriginY(float value) {
    originY = clamp(value);
    invalidateOutline();
  }

  void setProgress(float value) {
    float next = clamp(value);
    if (next < progress - 0.0001f) {
      hiding = true;
    } else if (next > progress + 0.0001f) {
      hiding = false;
    }
    progress = next;
    updateClipping();
    invalidateOutline();
  }

  @Override
  public boolean dispatchTouchEvent(MotionEvent event) {
    return progress >= 0.999f && super.dispatchTouchEvent(event);
  }

  private void updateClipping() {
    setAlpha(hiding ? progress : 1f);
    setClipToOutline(!hiding && progress < 0.999f);
  }

  private static float clamp(float value) {
    return Math.max(0f, Math.min(1f, value));
  }

  private final class RevealOutlineProvider extends ViewOutlineProvider {
    @Override
    public void getOutline(View view, Outline outline) {
      float centerX = getWidth() * originX;
      float centerY = getHeight() * originY;
      float farX = Math.max(centerX, getWidth() - centerX);
      float farY = Math.max(centerY, getHeight() - centerY);
      float radius = Math.max(0.01f, (float) Math.hypot(farX, farY) * progress);
      outline.setOval(
          Math.round(centerX - radius),
          Math.round(centerY - radius),
          Math.round(centerX + radius),
          Math.round(centerY + radius));
    }
  }
}
