# API

+ look into splitting list of entries to
  - plain data array
  - keyFunction
  - renderFunction
  - typeFunction (to aid recycling)
  - heightEstimator

+ customize anchoring, allow dynamic changing of anchoring from props

+ support bottom to top layout

+ support rendering inside scrollable element

+ add ability to customize update strategies

# Correctness/Bugs

+ support list changes below viewport top
+ support list changes above viewport top
+ ensure scroll to top works correctly
+ prevent infinite loops due to constant height updates

# Performance improvements

+ Recycling
+ Visibility update should split out rendering of new items
+ Defer cleanup to idle moments
  - removing unreferenced data from entries that have dissapeared

# Nice to have features

+ tombstones
+ animated transitions (fade in/out, smooth translations)

# Refactoring

+ look into removing dependency on Map/Set

# Research

+ listen to DOM mutations to fix positioning if items change automatically
