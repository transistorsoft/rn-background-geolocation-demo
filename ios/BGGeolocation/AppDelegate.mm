#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <TSBackgroundFetch/TSBackgroundFetch.h>
#import <TSLocationManager/TSLocationManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"BGGeolocation";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  
  
  
  // [REQUIRED] Register BackgroundFetch
  [[TSBackgroundFetch sharedInstance] didFinishLaunching];
  
  /// [background-geolocation] Undocumented hook function (current disabled) is the last word on whether a location will be inserted into the plugin's SQLite database.
  /// - Return an NSDictionary of any structure you wish, to be INSERTed into the plugin's SQLite db.
  /// - [tsLocation toDictionary] is default data-structure.
  /// - Return nil to cancel the INSERT.
  ///
  /*
  [TSLocationManager sharedInstance].beforeInsertBlock = ^(TSLocation *tsLocation) {
    NSLog(@"********** BEFORE INSERT: %@", tsLocation);
    CLLocation *location = tsLocation.location;  // <-- Native CLLocation instance for your convenience.
    return [tsLocation toDictionary];
  };
   */
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}


@end
