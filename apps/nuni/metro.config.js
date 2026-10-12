// Expo's default Metro config, minus agent worktrees: `.claude/worktrees/*` holds full checkouts
// (with node_modules) of this repo for parallel QA, which the file watcher must not crawl.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const worktrees = /[/\\]\.claude[/\\]worktrees[/\\].*/;
const blockList = config.resolver.blockList;
config.resolver.blockList = Array.isArray(blockList)
  ? [...blockList, worktrees]
  : blockList
    ? [blockList, worktrees]
    : [worktrees];

module.exports = config;
