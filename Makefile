# Copyright © 2025 Navarrotech

# Mark these targets as phony since they are not files.
.PHONY: all clean build build-js build-css

# Directories
DIST_DIR := dist
THEMES_DIR := $(DIST_DIR)/themes

# Commands
ESBUILD := yarn esbuild
SASS := yarn sass --quiet --load-path=./node_modules/bulma
RIMRAF := yarn rimraf

# Default target
all: build

# Clean the output directory
clean:
	$(RIMRAF) $(DIST_DIR)

# Build all assets
build: clean build-js build-css

# Build JavaScript files with esbuild
build-js:
	$(ESBUILD) src/contentScript.ts --bundle --outfile=$(DIST_DIR)/contentScript.js --platform=browser --format=iife
	$(ESBUILD) src/popup.ts --bundle --outfile=$(DIST_DIR)/popup.js --platform=browser --format=iife

# Build CSS files with sass
build-css:
	$(SASS) src/popup.sass $(DIST_DIR)/popup.css --style compressed
	$(SASS) src/themes/dark.sass $(THEMES_DIR)/dark.css --style compressed
	$(SASS) src/themes/banana.sass $(THEMES_DIR)/banana.css --style compressed
