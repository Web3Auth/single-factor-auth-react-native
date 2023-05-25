package com.web3authsinglefactor

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.web3auth.singlefactorauth.SingleFactorAuth
import com.web3auth.singlefactorauth.types.LoginParams
import com.web3auth.singlefactorauth.types.SingleFactorAuthArgs
import com.web3auth.singlefactorauth.types.TorusSubVerifierInfo
import org.torusresearch.fetchnodedetails.types.TorusNetwork
import java.math.BigInteger

class Web3authSingleFactorModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private lateinit var singleFactorAuth: SingleFactorAuth
  private lateinit var singleFactorAuthArgs: SingleFactorAuthArgs
  private lateinit var loginParams: LoginParams
  private var context: ReactApplicationContext = reactContext

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android

  @ReactMethod
  fun init(network: String) {
    singleFactorAuthArgs = SingleFactorAuthArgs(getNetwork(network))
    singleFactorAuth = SingleFactorAuth(singleFactorAuthArgs)
  }

  @ReactMethod
  fun initialize(promise: Promise) {
    val torusKeyCF = singleFactorAuth.initialize(context)
    torusKeyCF.join()
    var privateKey = BigInteger.ZERO
    torusKeyCF.whenComplete { key, error ->
      if (error == null) {
        privateKey = key.privateKey
      } else {
        throw Error(error)
      }
    }
    promise.resolve(privateKey.toString(16))
  }

  @ReactMethod
  fun getAggregateTorusKey(verifier: String, verifierId: String, idToken: String, aggregateVerifier: String, promise: Promise) {
    loginParams = LoginParams(aggregateVerifier, verifierId, idToken,
            arrayOf(TorusSubVerifierInfo(verifier, idToken)))
     val torusKeyCF = singleFactorAuth.getKey(loginParams, context)
     torusKeyCF.join()
     var privateKey = BigInteger.ZERO
     torusKeyCF.whenComplete { key, error ->
         if (error == null) {
            privateKey = key.privateKey
         } else {
            throw Error(error)
         }
     }
     promise.resolve(privateKey.toString(16))
  }

  @ReactMethod
  fun testTorusKey(verifier: String, verifierId: String, idToken: String, promise: Promise) {
     val idToken = JwtUtils.generateIdToken(verifierId)
     loginParams = LoginParams(verifier, verifierId, idToken)
     val torusKeyCF = singleFactorAuth.getKey(loginParams, context)
     torusKeyCF.join()
     var privateKey = BigInteger.ZERO
     torusKeyCF.whenComplete { key, error ->
         if (error == null) {
            privateKey = key.privateKey
         } else {
            throw Error(error)
         }
     }
     promise.resolve(privateKey.toString(16))
  }

  @ReactMethod
  fun getTorusKey(verifier: String, verifierId: String, idToken: String, promise: Promise) {
     loginParams = LoginParams(verifier, verifierId, idToken)
     val torusKeyCF = singleFactorAuth.getKey(loginParams, context)
     torusKeyCF.join()
     var privateKey = BigInteger.ZERO
     torusKeyCF.whenComplete { key, error ->
         if (error == null) {
            privateKey = key.privateKey
         } else {
            throw Error(error)
         }
     }
     promise.resolve(privateKey.toString(16))
  }

  private fun getNetwork(network: String): TorusNetwork {
      return when(network) {
          "mainnet" -> TorusNetwork.MAINNET
          "testnet" -> TorusNetwork.TESTNET
          "aqua" -> TorusNetwork.AQUA
          "cyan" -> TorusNetwork.CYAN
          "celeste" -> TorusNetwork.CELESTE
          else -> TorusNetwork.MAINNET
      }
  }

  companion object {
    const val NAME = "Web3authSingleFactor"
  }
}
