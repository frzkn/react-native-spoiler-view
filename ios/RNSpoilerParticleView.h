#import <UIKit/UIKit.h>

@interface RNSpoilerParticleView : UIView

@property (nonatomic, assign) CGFloat originX;
@property (nonatomic, assign) CGFloat originY;
@property (nonatomic, assign) CGFloat progress;
@property (nonatomic, assign) NSInteger particleCount;
@property (nonatomic, assign) NSInteger seed;
@property (nonatomic, strong) UIColor *particleColor;
@property (nonatomic, strong) UIColor *overlayColor;
@property (nonatomic, assign) CGFloat minimumSize;
@property (nonatomic, assign) CGFloat maximumSize;
@property (nonatomic, assign) CGFloat driftAmount;
@property (nonatomic, assign) CGFloat noiseSpeed;
@property (nonatomic, assign) BOOL reduceMotion;

@end
