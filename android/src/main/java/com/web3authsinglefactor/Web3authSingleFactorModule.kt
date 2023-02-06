package com.web3authsinglefactor

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.github.web3auth.singlefactorauth.SingleFactorAuth
import com.github.web3auth.singlefactorauth.types.LoginParams
import com.github.web3auth.singlefactorauth.types.SingleFactorAuthArgs
import com.github.web3auth.singlefactorauth.types.TorusSubVerifierInfo
import org.torusresearch.fetchnodedetails.types.TorusNetwork
import java.math.BigInteger

class Web3authSingleFactorModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private lateinit var singleFactorAuth: SingleFactorAuth
  private lateinit var singleFactorAuthArgs: SingleFactorAuthArgs
  private lateinit var loginParams: LoginParams

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  fun multiply(a: Double, b: Double, promise: Promise) {
    promise.resolve(a * b)
  }

  @ReactMethod
  fun add(a: Double, b: Double, promise: Promise) {
    promise.resolve(a + b)
  }

  @ReactMethod
  fun getTorusKey(network: String, verifier: String, email: String, idToken: String, promise: Promise) {
     singleFactorAuthArgs = SingleFactorAuthArgs(getNetwork(network))
     singleFactorAuth = SingleFactorAuth(singleFactorAuthArgs)
     loginParams = LoginParams(verifier, email, idToken,
          arrayOf(TorusSubVerifierInfo(email,idToken)))
     val torusKeyCF = singleFactorAuth.getKey(loginParams)
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
