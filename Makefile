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
	$(SASS) src/themes/bubblegum.sass $(THEMES_DIR)/bubblegum.css --style compressed
	$(SASS) src/themes/spark.sass $(THEMES_DIR)/spark.css --style compressed

# You can combine this with a watch command to watch for changes to a specific css theme.
# nodemon --watch src --ext sass,scss --exec "make build-css-target -e theme=dark"
build-css-target:
	$(SASS) src/themes/$(theme).sass $(THEMES_DIR)/$(theme).css --style compressed
