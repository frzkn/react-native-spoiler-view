#import <React/RCTViewManager.h>
#import "RNSpoilerRevealView.h"

@interface RNSpoilerRevealViewManager : RCTViewManager
@end

@implementation RNSpoilerRevealViewManager

RCT_EXPORT_MODULE(RNSpoilerRevealView)

- (UIView *)view
{
  return [RNSpoilerRevealView new];
}

RCT_EXPORT_VIEW_PROPERTY(originX, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(originY, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat)

@end
