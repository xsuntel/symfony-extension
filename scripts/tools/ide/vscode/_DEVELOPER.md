# Tools - IDE - VSCode - Developer

## Dev Environment

### Requirement

* Update your name and email for Git

  ```bash
  git config --global user.name "{Your Name}"
  ```

  ```bash
  git config --global user.email "{Your Email}"
  ```

  ```bash
  git config --global init.defaultBranch main
  git config --global credential.helper store

  git config --global --list
  ```

### Work Directory

* Create a folder (example)

  ```bash
  mkdir -p ~/Repositories
  mkdir -p ~/Repositories/GitHub

  cd ~/Repositories/GitHub
  ```

* Download this project

  ```bash
  git clone https://github.com/xsuntel/symfony-extension.git
  ```

  ```bash
  cd symfony-extension && find ./scripts/ -type f -name "*.sh" -exec chmod 775 {} \;
  ```

## Tools

* AI
  * Anthropic - [Claude Code](https://claude.com)
  * GitHub - [Copilot](https://copilot.microsoft.com)
* IDE
  * [Visual Studio Code](https://code.visualstudio.com)      - [Document](https://github.com/xsuntel/symfony-scripts/blob/main/tools/ide/vscode/_ABSTRACT.md)
    * Extension - [symfony-extention](https://github.com/xsuntel/symfony-extention)
