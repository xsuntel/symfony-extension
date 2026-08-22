#!/bin/bash

set -euo pipefail
# ----------------------------------------------------------------------------------------------------------------------
# Tools - Git - Clear history
# ----------------------------------------------------------------------------------------------------------------------

find_project_root() {
    local PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    while [[ "${PROJECT_DIR}" != "/" ]]; do
        if [[ -d "${PROJECT_DIR}/.git" ]] || [[ -f "${PROJECT_DIR}/.env.app" ]]; then
            echo "${PROJECT_DIR}"
            return 0
        fi
        PROJECT_DIR="$(dirname "${PROJECT_DIR}")"
    done
    return 1
}

PROJECT_PATH=$(find_project_root)
PROJECT_NAME=$(basename "$(realpath "${PROJECT_PATH}")")
cd "${PROJECT_PATH}" || exit

# ----------------------------------------------------------------------------------------------------------------------
# Abstract
# ----------------------------------------------------------------------------------------------------------------------

if [ -f "${PROJECT_PATH}/scripts/common/_abstract.sh" ]; then
  source "${PROJECT_PATH}/scripts/common/_abstract.sh"
else
  echo "Please check a file : ./scripts/common/_abstract.sh" && exit
fi

# >>>> Environment

setEnvironment() {
  echo -e "----------------------------------------------------------------------------------------------------------"
  echo -e "[ ENV ] ${PLATFORM_TYPE} - ${PLATFORM_PROCESSOR}"
  echo -e "----------------------------------------------------------------------------------------------------------\n"
  PS3="Menu: "
  select num in "dev" "exit"; do
    case "$REPLY" in
    1)
      # >>>> Dev Environment
      ENVIRONMENT_NAME="dev"
      break
      ;;
    2)
      echo "exit()"
      setEnd
      ;;
    *)
      echo "[ ERROR ] Unknown Command"
      setEnd
      ;;
    esac
  done

  echo
  echo "- PROJECT ENV : ${ENVIRONMENT_NAME}"
  echo
}

# >>>> Platform

setPlatform() {
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "[ ${ENVIRONMENT_NAME} ] ${PLATFORM_TYPE} - Platform"
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "- PLATFORM OS : ${PLATFORM_TYPE}"
  echo
}

# >>>> Project

setProject() {
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "[ ${ENVIRONMENT_NAME} ] ${PLATFORM_TYPE} - Project"
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "- PROJECT NAME : ${PROJECT_NAME}"
  echo
}

# >>>> Utility

setUtility() {
  echo -e "----------------------------------------------------------------------------------------------------------"
  echo -e "[ ${ENVIRONMENT_NAME} ] ${PLATFORM_TYPE} - Utility"
  echo -e "----------------------------------------------------------------------------------------------------------\n"

  # >>>> Project - Content - Git
  echo ">>>> Git - Project"
  echo

  DEFAULT_BRANCH=$(git config --get init.defaultBranch || echo "main")
  RELEASES_VERSION=$(date +%Y.%m.%d)
  TODAY=$(date "+%Y-%m-%d")

  # 1. Create a new branch
  git checkout --orphan temp_branch
  echo "✔ Created orphan branch: temp_branch"
  echo

  # 2. Update all of the files and commit
  git add -A
  git commit -m "Initial Reset"
  echo "✔ Committed all files with message: Backup ${TODAY}"
  echo

  # 3. Delete current main branch
  git branch -D main 2>/dev/null || git branch -D master 2>/dev/null
  echo "✔ Deleted old main branch"
  echo

  # 4. Move from current temp_branch to main branch
  git branch -m main
  echo "✔ Renamed temp_branch to main"
  echo

  # 5. Push it to main branch
  echo ">>>> Pushing to remote origin main..."
  git push -f origin main
  echo

  # 6. Show logs
  echo ">>>> Git Log (Latest 5)"
  git log -5 --graph --date=short --pretty=format:'%C(auto)%h %Cgreen(%ad)%Creset %s %C(bold blue)<%an>%Creset%C(auto)%d%Creset'
  echo
}

# ----------------------------------------------------------------------------------------------------------------------
# START
# ----------------------------------------------------------------------------------------------------------------------

setStart

# >>>> Environment
setEnvironment

# >>>> Platform
setPlatform

# >>>> Project
setProject

# >>>> Utility
setUtility

# ----------------------------------------------------------------------------------------------------------------------
# END
# ----------------------------------------------------------------------------------------------------------------------

setEnd
