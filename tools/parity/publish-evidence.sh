#!/bin/bash
# Publish comparison images to the `parity-evidence` branch and print the raw URLs.
#
# The branch holds no code and never merges into `main`. It exists so a pull request can show a
# side-by-side image inline: GitHub renders an image from any URL, and a file on a branch of a
# public repository has one.
#
#   tools/parity/publish-evidence.sh <name> <image> [<image> ...]
#
# <name> is the directory on the branch, normally the slice or the issue number. Each image is
# copied there under its own basename. The raw URL of each is printed, ready to paste into a pull
# request body as `![](url)`.
#
# It clones the branch fresh into a temporary directory every run rather than keeping one around,
# because a stale local copy of a branch several pull requests behind is how an image lands on top
# of one somebody else pushed.
set -eu

REMOTE=https://github.com/cloudadoption/contitires
BRANCH=parity-evidence
RAW=https://raw.githubusercontent.com/cloudadoption/contitires/$BRANCH

if [ $# -lt 2 ]; then
  echo "usage: $0 <name> <image> [<image> ...]" >&2
  exit 2
fi

NAME=$1
shift

# A name with a slash or a leading dot would write outside the directory it names.
case "$NAME" in
  */*|.*) echo "$0: '$NAME' must be a plain directory name" >&2; exit 2 ;;
esac

for f in "$@"; do
  [ -f "$f" ] || { echo "$0: $f does not exist" >&2; exit 2; }
done

WORK=$(mktemp -d "${TMPDIR:-/tmp}/parity-evidence.XXXXXX")
git clone --quiet --depth 1 --branch "$BRANCH" "$REMOTE" "$WORK/repo"

mkdir -p "$WORK/repo/$NAME"
for f in "$@"; do
  cp "$f" "$WORK/repo/$NAME/$(basename "$f")"
done

cd "$WORK/repo"
git add -A
if git diff --cached --quiet; then
  echo "$0: nothing changed, the images are already on the branch" >&2
else
  git -c user.email=benp@adobe.com -c user.name="Ben Peter" \
    commit --quiet -m "parity evidence: $NAME"
  git push --quiet origin "$BRANCH"
fi

for f in "$@"; do
  echo "$RAW/$NAME/$(basename "$f")"
done
