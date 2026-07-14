package com.reactnativespoilerview;

import androidx.annotation.NonNull;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

public final class SpoilerRevealViewManager extends ViewGroupManager<SpoilerRevealView> {
  public static final String NAME = "RNSpoilerRevealView";

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @NonNull
  @Override
  protected SpoilerRevealView createViewInstance(@NonNull ThemedReactContext context) {
    return new SpoilerRevealView(context);
  }

  @ReactProp(name = "originX", defaultFloat = 0.5f)
  public void setOriginX(SpoilerRevealView view, float value) {
    view.setOriginX(value);
  }

  @ReactProp(name = "originY", defaultFloat = 0.5f)
  public void setOriginY(SpoilerRevealView view, float value) {
    view.setOriginY(value);
  }

  @ReactProp(name = "progress", defaultFloat = 0f)
  public void setProgress(SpoilerRevealView view, float value) {
    view.setProgress(value);
  }
}
