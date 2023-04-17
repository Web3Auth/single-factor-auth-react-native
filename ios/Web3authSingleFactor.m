#import <React/RCTBridgeModule.h>

(TorusNetwork *)getNetwork:(NSString *)network {
  if ([network isEqualToString:@"mainnet"]) {
    return TorusNetwork.MAINNET;
  } else if ([network isEqualToString:@"testnet"]) {
    return TorusNetwork.TESTNET;
  } else if ([network isEqualToString:@"aqua"]) {
    return TorusNetwork.AQUA;
  } else if ([network isEqualToString:@"cyan"]) {
    return TorusNetwork.CYAN;
  } else if ([network isEqualToString:@"celeste"]) {
    return TorusNetwork.CELESTE;
  } else {
    return TorusNetwork.MAINNET;
  }
}

@interface RCT_EXTERN_MODULE(Web3authSingleFactor, NSObject)

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
    SingleFactorAuthArgs *args = [[SingleFactorAuthArgs alloc] initWithNetwork:getNetwork(network)];
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
    SingleFactorAuthArgs *args = [[SingleFactorAuthArgs alloc] initWithNetwork:getNetwork(network)];
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
