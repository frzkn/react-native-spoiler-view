#import "RNSpoilerRevealView.h"

@implementation RNSpoilerRevealView {
  CAShapeLayer *_revealMask;
  BOOL _hiding;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _originX = 0.5;
    _originY = 0.5;
    _progress = 0;
    _revealMask = [CAShapeLayer layer];
  }
  return self;
}

- (void)setOriginX:(CGFloat)value
{
  _originX = MIN(1, MAX(0, value));
  [self updateMask];
}

- (void)setOriginY:(CGFloat)value
{
  _originY = MIN(1, MAX(0, value));
  [self updateMask];
}

- (void)setProgress:(CGFloat)value
{
  CGFloat next = MIN(1, MAX(0, value));
  if (next < _progress - 0.0001) {
    _hiding = YES;
  } else if (next > _progress + 0.0001) {
    _hiding = NO;
  }
  _progress = next;
  [self updateMask];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateMask];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  if (_progress < 0.999) {
    return nil;
  }
  return [super hitTest:point withEvent:event];
}

- (void)updateMask
{
  [CATransaction begin];
  [CATransaction setDisableActions:YES];

  if (_hiding) {
    self.layer.mask = nil;
    self.layer.opacity = (float)_progress;
    [CATransaction commit];
    return;
  }

  self.layer.opacity = 1;
  if (_progress >= 0.999) {
    self.layer.mask = nil;
    [CATransaction commit];
    return;
  }

  CGFloat centerX = CGRectGetWidth(self.bounds) * _originX;
  CGFloat centerY = CGRectGetHeight(self.bounds) * _originY;
  CGFloat farX = MAX(centerX, CGRectGetWidth(self.bounds) - centerX);
  CGFloat farY = MAX(centerY, CGRectGetHeight(self.bounds) - centerY);
  CGFloat radius = MAX(0.001, hypot(farX, farY) * _progress);
  CGRect circle = CGRectMake(centerX - radius, centerY - radius, radius * 2, radius * 2);

  _revealMask.frame = self.bounds;
  _revealMask.path = [UIBezierPath bezierPathWithOvalInRect:circle].CGPath;
  self.layer.mask = _revealMask;
  [CATransaction commit];
}

@end
