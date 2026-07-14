package com.reactnativespoilerview;

import androidx.annotation.NonNull;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.annotations.ReactProp;

public final class SpoilerParticleViewManager extends SimpleViewManager<SpoilerParticleView> {
  public static final String NAME = "RNSpoilerParticleView";

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @NonNull
  @Override
  protected SpoilerParticleView createViewInstance(@NonNull ThemedReactContext context) {
    return new SpoilerParticleView(context);
  }

  @ReactProp(name = "originX", defaultFloat = 0.5f)
  public void setOriginX(SpoilerParticleView view, float value) { view.setOriginX(value); }

  @ReactProp(name = "originY", defaultFloat = 0.5f)
  public void setOriginY(SpoilerParticleView view, float value) { view.setOriginY(value); }

  @ReactProp(name = "progress", defaultFloat = 0f)
  public void setProgress(SpoilerParticleView view, float value) { view.setProgress(value); }

  @ReactProp(name = "particleCount", defaultInt = 180)
  public void setParticleCount(SpoilerParticleView view, int value) { view.setParticleCount(value); }

  @ReactProp(name = "seed", defaultInt = 1)
  public void setSeed(SpoilerParticleView view, int value) { view.setSeed(value); }

  @ReactProp(name = "particleColor", customType = "Color")
  public void setParticleColor(SpoilerParticleView view, int value) { view.setParticleColor(value); }

  @ReactProp(name = "overlayColor", customType = "Color")
  public void setOverlayColor(SpoilerParticleView view, int value) { view.setOverlayColor(value); }

  @ReactProp(name = "minimumSize", defaultFloat = 0.45f)
  public void setMinimumSize(SpoilerParticleView view, float value) { view.setMinimumSize(value); }

  @ReactProp(name = "maximumSize", defaultFloat = 0.8f)
  public void setMaximumSize(SpoilerParticleView view, float value) { view.setMaximumSize(value); }

  @ReactProp(name = "driftAmount", defaultFloat = 1f)
  public void setDriftAmount(SpoilerParticleView view, float value) { view.setDriftAmount(value); }

  @ReactProp(name = "noiseSpeed", defaultFloat = 0.3f)
  public void setNoiseSpeed(SpoilerParticleView view, float value) { view.setNoiseSpeed(value); }

  @ReactProp(name = "revealDuration", defaultFloat = 500f)
  public void setRevealDuration(SpoilerParticleView view, float value) { view.setRevealDuration(value); }

  @ReactProp(name = "reduceMotion", defaultBoolean = false)
  public void setReduceMotion(SpoilerParticleView view, boolean value) { view.setReduceMotion(value); }
}
