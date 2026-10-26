// Google's Maven only serves Android/AndroidX artifacts; scoping it keeps
// `:core` (pure JVM) resolvable where that host is unreachable.
fun RepositoryHandler.googleScoped() =
    google {
        content {
            includeGroupByRegex("com\\.android.*")
            includeGroupByRegex("androidx.*")
            includeGroupByRegex("com\\.google\\.android.*")
            includeGroup("com.google.testing.platform")
        }
    }

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("androidx.*")
                includeGroupByRegex("com\\.google\\.android.*")
                includeGroup("com.google.testing.platform")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        googleScoped()
        mavenCentral()
    }
}

rootProject.name = "titan"

include(":core")

// `-Ptitan.coreOnly=true` builds just the JVM module, for machines without
// the Android SDK.
if (providers.gradleProperty("titan.coreOnly").orNull != "true") {
    include(":app")
}
