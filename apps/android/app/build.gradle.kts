plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ktlint)
}

// Release signing comes from the environment (CI); without it, release
// builds fall back to the debug key so they still assemble.
val keystorePath: String? = providers.environmentVariable("TITAN_KEYSTORE").orNull

android {
    namespace = "net.prussin.titan"
    compileSdk = 37

    defaultConfig {
        applicationId = "net.prussin.titan"
        minSdk = 37
        targetSdk = 37
        versionCode = providers.environmentVariable("TITAN_VERSION_CODE").orNull?.toInt() ?: 1
        versionName = providers.environmentVariable("TITAN_VERSION_NAME").orNull ?: "dev"
    }

    signingConfigs {
        create("release") {
            if (keystorePath != null) {
                storeFile = file(keystorePath)
                storePassword = providers.environmentVariable("TITAN_KEYSTORE_PASSWORD").get()
                keyAlias = providers.environmentVariable("TITAN_KEY_ALIAS").get()
                keyPassword = providers.environmentVariable("TITAN_KEYSTORE_PASSWORD").get()
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName(if (keystorePath != null) "release" else "debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }
}

ktlint {
    version.set(libs.versions.ktlint.cli)
}

dependencies {
    implementation(project(":core"))
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.activity.compose)
    implementation(libs.browser)
    implementation(libs.credentials)
    implementation(libs.credentials.play.services)
    implementation(libs.googleid)
    // Play services auth pulls Fragment 1.1, which the ActivityResult lint rejects.
    implementation(libs.fragment)
    implementation(libs.core.ktx)
    implementation(libs.work.runtime)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.process)
    implementation(libs.kotlinx.coroutines.android)
}
