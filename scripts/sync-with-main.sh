#!/usr/bin/env bash
# Fast-forward or merge origin/main into the current branch so a PR does not
# open against a stale snapshot of main.
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "sync-with-main: not a git repository" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "sync-with-main: working tree is not clean. Commit or stash first." >&2
  exit 1
fi

git fetch origin main

current_branch="$(git branch --show-current)"
if [[ -z "${current_branch}" ]]; then
  echo "sync-with-main: detached HEAD is not supported" >&2
  exit 1
fi

if [[ "${current_branch}" == "main" ]]; then
  git merge --ff-only origin/main
  echo "sync-with-main: main is up to date with origin/main"
  exit 0
fi

if git merge-base --is-ancestor origin/main HEAD; then
  echo "sync-with-main: ${current_branch} already contains origin/main"
  exit 0
fi

if git merge --no-edit origin/main; then
  echo "sync-with-main: merged origin/main into ${current_branch}"
  exit 0
fi

echo "sync-with-main: merge conflicts with origin/main. Resolve these files:" >&2
git diff --name-only --diff-filter=U >&2
echo "After resolving, commit and push. To abort: git merge --abort" >&2
exit 2
