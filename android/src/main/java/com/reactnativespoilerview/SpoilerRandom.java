package com.reactnativespoilerview;

/** Small deterministic generator used only to keep particle layouts stable. */
final class SpoilerRandom {
  private int state;

  SpoilerRandom(int seed) {
    state = seed;
  }

  float nextFloat() {
    state = state * 1664525 + 1013904223;
    return (float) (Integer.toUnsignedLong(state) / 4_294_967_296.0);
  }
}
