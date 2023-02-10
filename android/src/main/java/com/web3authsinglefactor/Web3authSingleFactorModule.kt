package com.web3authsinglefactor

import com.auth0.jwt.algorithms.Algorithm
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.github.web3auth.singlefactorauth.SingleFactorAuth
import com.github.web3auth.singlefactorauth.types.LoginParams
import com.github.web3auth.singlefactorauth.types.SingleFactorAuthArgs
import org.torusresearch.fetchnodedetails.types.TorusNetwork
import com.github.web3auth.singlefactorauth.types.TorusSubVerifierInfo
import java.math.BigInteger

class Web3authSingleFactorModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private lateinit var singleFactorAuth: SingleFactorAuth
  private lateinit var singleFactorAuthArgs: SingleFactorAuthArgs
  private lateinit var loginParams: LoginParams
  private lateinit var algorithmRs: Algorithm
  private var key = "-----BEGIN PRIVATE KEY-----\nMEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==\n-----END PRIVATE KEY-----"

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  fun getAggregateTorusKey(network: String, verifier: String, verifierId: String, idToken: String, aggregateVerifier: String, promise: Promise) {
    singleFactorAuthArgs = SingleFactorAuthArgs(getNetwork(network))
     singleFactorAuth = SingleFactorAuth(singleFactorAuthArgs)
     val idToken = JwtUtils.generateIdToken(verifierId)
     loginParams = LoginParams(aggregateVerifier, verifierId, idToken,
            arrayOf(TorusSubVerifierInfo(verifier, idToken)))
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

  @ReactMethod
  fun testTorusKey(network: String, verifier: String, verifierId: String, idToken: String, promise: Promise) {
     singleFactorAuthArgs = SingleFactorAuthArgs(getNetwork(network))
     singleFactorAuth = SingleFactorAuth(singleFactorAuthArgs)
     val idToken = JwtUtils.generateIdToken(verifierId)
     loginParams = LoginParams(verifier, verifierId, idToken)
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

  @ReactMethod
  fun getTorusKey(network: String, verifier: String, verifierId: String, idToken: String, promise: Promise) {
     singleFactorAuthArgs = SingleFactorAuthArgs(getNetwork(network))
     singleFactorAuth = SingleFactorAuth(singleFactorAuthArgs)
     loginParams = LoginParams(verifier, verifierId, idToken)
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