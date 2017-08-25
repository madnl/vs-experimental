# API

+ look into splitting list of entries to
  - plain data array
  - keyFunction
  - renderFunction
  - typeFunction

+ customize anchoring, allow dynamic changing of anchoring from props

+ support bottom to top layout

+ support rendering inside scrollable element

+ add ability to customize update strategies

# Correctness/Bugs

+ ensure first item always positioned at offset 0
+ support list changes below viewport top
+ support list changes above viewport top
+ ensure scroll to top works correctly

# Performance improvements

+ Visibility update should split out rendering of new items

# Nice to have features

+ tombstones
+ animated transitions (fade in/out, smooth translations)

# Refactoring

+ look into removing dependency on Map/Set

# Research

+ listen to DOM mutations to fix positioning if items change automatically
