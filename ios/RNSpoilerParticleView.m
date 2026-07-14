#import "RNSpoilerParticleView.h"
#import <QuartzCore/QuartzCore.h>

static CGFloat RNSpoilerClamp(CGFloat value, CGFloat minimum, CGFloat maximum)
{
  return MIN(maximum, MAX(minimum, value));
}

static const CGFloat RNSpoilerDefaultNoiseSpeed = 0.3;
static const CGFloat RNSpoilerAmbientLifetime = 1.0;
static const CGFloat RNSpoilerAmbientMaximumVelocity = 20.0;
static const CGFloat RNSpoilerAmbientVelocityLimit = 2000.0;

@interface RNSpoilerParticleView ()
@property (nonatomic, strong) CALayer *coverLayer;
@property (nonatomic, strong) CAEmitterLayer *ambientLayer;
@property (nonatomic, strong) CALayer *staticLayer;
@property (nonatomic, strong) CAShapeLayer *ambientMask;
@property (nonatomic, strong) CAShapeLayer *staticMask;
@property (nonatomic, strong) NSArray<CAShapeLayer *> *staticTierLayers;
@property (nonatomic, strong) UIImage *particleImage;
@property (nonatomic, assign) BOOL appActive;
@property (nonatomic, assign) BOOL hiding;
@property (nonatomic, assign) CGSize staticSize;
@end

@implementation RNSpoilerParticleView

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _originX = 0.5;
    _originY = 0.5;
    _progress = 0;
    _particleCount = 180;
    _seed = 1;
    _particleColor = [UIColor colorWithRed:80.0 / 255.0
                                     green:80.0 / 255.0
                                      blue:80.0 / 255.0
                                     alpha:1.0];
    _overlayColor = UIColor.clearColor;
    _minimumSize = 0.45;
    _maximumSize = 0.8;
    _driftAmount = 1.0;
    _noiseSpeed = 0.3;
    _appActive = UIApplication.sharedApplication.applicationState == UIApplicationStateActive;

    self.userInteractionEnabled = NO;
    self.clipsToBounds = YES;

    _coverLayer = [CALayer layer];
    [self.layer addSublayer:_coverLayer];

    _ambientMask = [CAShapeLayer layer];
    _ambientMask.fillRule = kCAFillRuleEvenOdd;
    _ambientLayer = [CAEmitterLayer layer];
    _ambientLayer.masksToBounds = YES;
    _ambientLayer.renderMode = kCAEmitterLayerUnordered;
    _ambientLayer.emitterShape = kCAEmitterLayerRectangle;
    _ambientLayer.emitterMode = kCAEmitterLayerSurface;
    _ambientLayer.mask = _ambientMask;
    [self.layer addSublayer:_ambientLayer];

    _staticMask = [CAShapeLayer layer];
    _staticMask.fillRule = kCAFillRuleEvenOdd;
    _staticLayer = [CALayer layer];
    _staticLayer.mask = _staticMask;
    _staticLayer.hidden = YES;
    [self.layer addSublayer:_staticLayer];

    NSMutableArray<CAShapeLayer *> *tierLayers = [NSMutableArray arrayWithCapacity:3];
    for (NSInteger index = 0; index < 3; index += 1) {
      CAShapeLayer *tierLayer = [CAShapeLayer layer];
      [_staticLayer addSublayer:tierLayer];
      [tierLayers addObject:tierLayer];
    }
    _staticTierLayers = tierLayers;

    _particleImage = [self.class makeParticleImage];
    [self configureAmbientCell];

    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    [center addObserver:self
               selector:@selector(applicationDidEnterBackground)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(applicationWillEnterForeground)
                   name:UIApplicationWillEnterForegroundNotification
                 object:nil];
  }
  return self;
}

- (void)dealloc
{
  [NSNotificationCenter.defaultCenter removeObserver:self];
}

+ (UIImage *)makeParticleImage
{
  static UIImage *image;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    CGSize size = CGSizeMake(4.0, 4.0);
    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    [UIColor.whiteColor setFill];
    [[UIBezierPath bezierPathWithOvalInRect:CGRectMake(1.0, 1.0, 2.0, 2.0)] fill];
    image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
  });
  return image;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window && self.progress < 0.999 && self.appActive) {
    [self restartAmbient];
  } else if (!self.window) {
    self.ambientLayer.birthRate = 0;
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  CGRect bounds = self.bounds;
  self.coverLayer.frame = bounds;
  self.ambientLayer.frame = bounds;
  self.ambientLayer.emitterPosition = CGPointMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds));
  self.ambientLayer.emitterSize = bounds.size;
  self.staticLayer.frame = bounds;
  for (CAShapeLayer *tierLayer in self.staticTierLayers) tierLayer.frame = bounds;
  [self updateRevealMask];
  if ([self isMotionReduced] && !CGSizeEqualToSize(self.staticSize, bounds.size)) {
    [self rebuildStaticParticles];
  }
}

- (void)setOriginX:(CGFloat)value
{
  _originX = RNSpoilerClamp(value, 0, 1);
  [self updateRevealMask];
}

- (void)setOriginY:(CGFloat)value
{
  _originY = RNSpoilerClamp(value, 0, 1);
  [self updateRevealMask];
}

- (void)setProgress:(CGFloat)value
{
  CGFloat previous = _progress;
  CGFloat next = RNSpoilerClamp(value, 0, 1);
  BOOL wasHiding = self.hiding;
  if (next < previous - 0.0001) {
    self.hiding = YES;
  } else if (next > previous + 0.0001) {
    self.hiding = NO;
  }
  _progress = next;

  BOOL startedHide = self.hiding && !wasHiding;
  if (startedHide) [self restartAmbient];
  [self updatePresentationState];
}

- (void)setParticleCount:(NSInteger)value
{
  _particleCount = MAX(0, MIN(1000, value));
  [self configureAmbientCell];
  if ([self isMotionReduced]) [self rebuildStaticParticles];
}

- (void)setSeed:(NSInteger)value
{
  _seed = value;
  self.ambientLayer.seed = (unsigned int)value;
  if ([self isMotionReduced]) [self rebuildStaticParticles];
}

- (void)setParticleColor:(UIColor *)value
{
  _particleColor = value ?: UIColor.clearColor;
  [self configureAmbientCell];
  if ([self isMotionReduced]) [self rebuildStaticParticles];
}

- (void)setOverlayColor:(UIColor *)value
{
  _overlayColor = value ?: UIColor.clearColor;
  self.coverLayer.backgroundColor = _overlayColor.CGColor;
  [self updatePresentationState];
}

- (void)setMinimumSize:(CGFloat)value
{
  _minimumSize = MAX(0, value);
  _maximumSize = MAX(_maximumSize, _minimumSize);
  [self configureAmbientCell];
  if ([self isMotionReduced]) [self rebuildStaticParticles];
}

- (void)setMaximumSize:(CGFloat)value
{
  _maximumSize = MAX(_minimumSize, value);
  [self configureAmbientCell];
  if ([self isMotionReduced]) [self rebuildStaticParticles];
}

- (void)setDriftAmount:(CGFloat)value
{
  _driftAmount = MAX(0, value);
  [self configureAmbientCell];
}

- (void)setNoiseSpeed:(CGFloat)value
{
  _noiseSpeed = MAX(0, value);
  [self configureAmbientCell];
}

- (void)setReduceMotion:(BOOL)value
{
  if (_reduceMotion == value) return;
  _reduceMotion = value;
  if (value) {
    self.ambientLayer.birthRate = 0;
    [self rebuildStaticParticles];
  } else {
    self.staticSize = CGSizeZero;
    for (CAShapeLayer *tierLayer in self.staticTierLayers) tierLayer.path = nil;
    [self restartAmbient];
  }
  [self updatePresentationState];
}

- (BOOL)isMotionReduced
{
  return self.reduceMotion || UIAccessibilityIsReduceMotionEnabled();
}

- (void)configureAmbientCell
{
  CAEmitterCell *cell = [CAEmitterCell emitterCell];
  cell.name = @"ambientDust";
  cell.contents = (__bridge id)self.particleImage.CGImage;
  cell.contentsScale = self.particleImage.scale;
  cell.color = self.particleColor.CGColor;
  cell.emissionRange = (CGFloat)(M_PI * 2.0);
  cell.lifetime = RNSpoilerAmbientLifetime;
  cell.lifetimeRange = 0;
  BOOL particlesVisible = self.particleCount > 0 && self.maximumSize > 0 &&
      CGColorGetAlpha(self.particleColor.CGColor) > 0;
  cell.birthRate = particlesVisible ? self.particleCount / MAX(0.1, cell.lifetime) : 0;
  CGFloat motionScale = self.noiseSpeed / RNSpoilerDefaultNoiseSpeed;
  CGFloat maximumVelocity = MIN(RNSpoilerAmbientVelocityLimit,
                                RNSpoilerAmbientMaximumVelocity * self.driftAmount * motionScale);
  cell.velocity = maximumVelocity * 0.5;
  cell.velocityRange = maximumVelocity * 0.5;
  CGFloat averageSize = (self.minimumSize + self.maximumSize) * 0.5;
  cell.scale = averageSize;
  cell.scaleRange = MAX(0, (self.maximumSize - self.minimumSize) * 0.5);
  cell.alphaRange = 0.7;
  cell.alphaSpeed = -0.18;
  self.ambientLayer.seed = (unsigned int)self.seed;
  self.ambientLayer.emitterCells = @[cell];
}

- (void)restartAmbient
{
  if (!self.window || !self.appActive ||
      (self.progress >= 0.999 && !self.hiding) || [self isMotionReduced]) {
    self.ambientLayer.birthRate = 0;
    return;
  }
  [self configureAmbientCell];
  self.ambientLayer.beginTime = [self.ambientLayer convertTime:CACurrentMediaTime()
                                                         fromLayer:nil] - 2.2;
  self.ambientLayer.birthRate = 1;
}

- (void)updatePresentationState
{
  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  self.coverLayer.opacity = (float)(1.0 - self.progress);
  float ambientOpacity = self.hiding ? (float)(1.0 - self.progress) : 1;
  self.ambientLayer.opacity = ambientOpacity;
  self.staticLayer.opacity = ambientOpacity;
  BOOL visible = self.progress < 0.999;
  BOOL motionReduced = [self isMotionReduced];
  if (motionReduced && self.staticTierLayers.firstObject.path == nil) {
    [self rebuildStaticParticles];
  }
  self.ambientLayer.hidden = !visible || motionReduced;
  self.staticLayer.hidden = !visible || !motionReduced;
  if (!visible || !self.appActive) {
    self.ambientLayer.birthRate = 0;
  } else if (!motionReduced && self.ambientLayer.birthRate == 0) {
    self.ambientLayer.birthRate = 1;
  }
  [self updateRevealMask];
  [CATransaction commit];
}

- (void)updateRevealMask
{
  CGRect bounds = self.bounds;
  UIBezierPath *path = [UIBezierPath bezierPathWithRect:bounds];
  if (!self.hiding) {
    CGFloat centerX = CGRectGetWidth(bounds) * self.originX;
    CGFloat centerY = CGRectGetHeight(bounds) * self.originY;
    CGFloat farX = MAX(centerX, CGRectGetWidth(bounds) - centerX);
    CGFloat farY = MAX(centerY, CGRectGetHeight(bounds) - centerY);
    CGFloat radius = hypot(farX, farY) * self.progress;
    CGRect circle = CGRectMake(centerX - radius, centerY - radius, radius * 2, radius * 2);
    [path appendPath:[UIBezierPath bezierPathWithOvalInRect:circle]];
  }

  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  self.ambientMask.frame = bounds;
  self.ambientMask.path = path.CGPath;
  self.staticMask.frame = bounds;
  self.staticMask.path = path.CGPath;
  [CATransaction commit];
}

- (void)rebuildStaticParticles
{
  CGSize size = self.bounds.size;
  if (![self isMotionReduced] || size.width <= 0 || size.height <= 0) return;
  CGMutablePathRef paths[3] = {
    CGPathCreateMutable(),
    CGPathCreateMutable(),
    CGPathCreateMutable(),
  };
  uint32_t state = (uint32_t)self.seed;
  if (self.maximumSize > 0 && CGColorGetAlpha(self.particleColor.CGColor) > 0) {
    for (NSInteger index = 0; index < self.particleCount; index += 1) {
      state = state * 1664525u + 1013904223u;
      CGFloat x = (state / (CGFloat)UINT32_MAX) * size.width;
      state = state * 1664525u + 1013904223u;
      CGFloat y = (state / (CGFloat)UINT32_MAX) * size.height;
      state = state * 1664525u + 1013904223u;
      CGFloat fraction = state / (CGFloat)UINT32_MAX;
      CGFloat radius = self.minimumSize + (self.maximumSize - self.minimumSize) * fraction;
      state = state * 1664525u + 1013904223u;
      NSUInteger tierIndex = state % 3;
      CGPathAddEllipseInRect(
          paths[tierIndex],
          NULL,
          CGRectMake(x - radius, y - radius, radius * 2, radius * 2));
    }
  }

  const CGFloat alphaTiers[3] = {0.3, 0.6, 1.0};
  CGFloat baseAlpha = CGColorGetAlpha(self.particleColor.CGColor);
  for (NSUInteger index = 0; index < self.staticTierLayers.count; index += 1) {
    CAShapeLayer *tierLayer = self.staticTierLayers[index];
    tierLayer.path = paths[index];
    tierLayer.fillColor = [self.particleColor colorWithAlphaComponent:
        baseAlpha * alphaTiers[index]].CGColor;
    CGPathRelease(paths[index]);
  }
  self.staticSize = size;
}

- (void)applicationDidEnterBackground
{
  self.appActive = NO;
  self.ambientLayer.birthRate = 0;
}

- (void)applicationWillEnterForeground
{
  self.appActive = YES;
  if (self.progress < 0.999 && ![self isMotionReduced]) [self restartAmbient];
  [self updatePresentationState];
}

@end
