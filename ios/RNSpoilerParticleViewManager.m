#import <React/RCTViewManager.h>
#import "RNSpoilerParticleView.h"

@interface RNSpoilerParticleViewManager : RCTViewManager
@end

@implementation RNSpoilerParticleViewManager

RCT_EXPORT_MODULE(RNSpoilerParticleView)

- (UIView *)view
{
  return [RNSpoilerParticleView new];
}

RCT_EXPORT_VIEW_PROPERTY(originX, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(originY, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(particleCount, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(seed, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(particleColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(overlayColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(minimumSize, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(maximumSize, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(driftAmount, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(noiseSpeed, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(reduceMotion, BOOL)

@end
