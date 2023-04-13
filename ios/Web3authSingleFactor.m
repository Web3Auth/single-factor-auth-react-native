#import <React/RCTBridgeModule.h>
#import "SingleFactorAuth.h"

@interface RCT_EXTERN_MODULE(Web3authSingleFactor, NSObject)

RCT_EXTERN_METHOD(multiply:(float)a withB:(float)b
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAggregateTorusKey: (NSString *)network verifier:(NSString *)verifier verifierId:(NSString *)verifierId idToken:(NSString *)idToken aggregateVerifier:(NSString *)aggregateVerifier
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getKey: (NSString *)network verifier:(NSString *)verifier verifierId:(NSString *)verifierId idToken:(NSString *)idToken
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)
@end

@implementation Web3authSingleFactor

RCT_EXTERN_METHOD(getAggregateTorusKey: (NSString *)network verifier:(NSString *)verifier verifierId:(NSString *)verifierId idToken:(NSString *)idToken aggregateVerifier:(NSString *)aggregateVerifier
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)
{
    SingleFactorAuthArgs *args = [[SingleFactorAuthArgs alloc] initWithNetwork:network];
    SingleFactorAuth *sfa = [[SingleFactorAuth alloc] initWithSingleFactorAuthArgs:args];

    NSMutableArray<TorusSubVerifierInfo *> *subVerifierInfoArray = [[NSMutableArray alloc] init];
    TorusSubVerifierInfo *subVerifierInfo = [[TorusSubVerifierInfo alloc] initWithVerifier:verifierId idToken:idToken];
    [subVerifierInfoArray addObject:subVerifierInfo];


    LoginParams *loginParams = [[LoginParams alloc] initWithVerifier:aggregateVerifier verifierId:verifierId idToken:idToken subVerifierInfoArray: subVerifierInfo];

    [sfa getKey:loginParams completion:^(TorusKey *key, NSError *error) {
        if (error != nil) {
            reject([error dictionaryRepresentation]);
            return;
        }
        resolve([key dictionaryRepresentation]);
    }];
}

RCT_EXTERN_METHOD(getKey: (NSString *)network verifier:(NSString *)verifier verifierId:(NSString *)verifierId idToken:(NSString *)idToken
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)
{
    SingleFactorAuthArgs *args = [[SingleFactorAuthArgs alloc] initWithNetwork:network];
    SingleFactorAuth *sfa = [[SingleFactorAuth alloc] initWithSingleFactorAuthArgs:args];
    LoginParams *loginParams = [[LoginParams alloc] initWithVerifier:verifier verifierId:verifierId idToken:idToken];

    [sfa getKey:loginParams completion:^(TorusKey *key, NSError *error) {
        if (error != nil) {
            reject([error dictionaryRepresentation]);
            return;
        }
        resolve([key dictionaryRepresentation]);
    }];
}

@end


+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
