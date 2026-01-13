@echo off
REM Auto-Claude Wrapper for Apex Project
REM Uses shared Auto-Claude installation at: C:\Jarvis\AI Workspace\Auto-Claude

REM Set project directory to Apex
set PROJECT_DIR=%~dp0

REM Path to shared Auto-Claude installation
set AUTO_CLAUDE_ROOT=C:\Jarvis\AI Workspace\Auto-Claude\auto-claude

REM Run Auto-Claude from shared installation with Apex as the project
python "%AUTO_CLAUDE_ROOT%\run.py" %*
