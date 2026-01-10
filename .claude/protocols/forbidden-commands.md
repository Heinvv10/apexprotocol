# Forbidden Commands - Data Loss Prevention

**STATUS**: PERMANENT BAN - CRITICAL SAFETY
**LOAD WHEN**: Any terminal operations, process management, or system commands

---

## ABSOLUTELY NEVER USE THESE COMMANDS

### Process Killing - BANNED FOREVER

```bash
# PERMANENTLY BANNED - These kill ALL processes and cause MASSIVE data loss
taskkill //F //IM node.exe        # FORBIDDEN
taskkill /F /IM node.exe          # FORBIDDEN
taskkill -F -IM node.exe          # FORBIDDEN
taskkill //F //IM npm.exe         # FORBIDDEN
taskkill //F //IM python.exe      # FORBIDDEN
pkill -f node                     # FORBIDDEN
killall node                      # FORBIDDEN
```

### System-Wide Destructive Commands

```bash
rm -rf /                          # FORBIDDEN - Deletes entire filesystem
format c:                         # FORBIDDEN - Formats hard drive
del /q /s *.*                     # FORBIDDEN - Deletes all files recursively
```

---

## Why These Commands Are Dangerous

- They terminate ALL processes system-wide, not just the target
- Users lose HOURS of work in multiple terminal instances
- Kills unrelated applications, dev servers, and tools
- Causes MASSIVE disruption and data loss
- Cannot be undone - work is permanently lost

---

## Safe Process Management Protocol

### Step 1: ASK USER FIRST
```
"Which specific process would you like me to stop?"
```

### Step 2: GET SPECIFICS
```bash
# Find process by port
netstat -ano | findstr :3000

# Get process details
tasklist | findstr node
```

### Step 3: GET CONFIRMATION
```
"Are you sure you want to stop process PID 12345?"
```

### Step 4: TARGETED KILL (with permission)
```bash
# Kill only specific PID
taskkill //F //PID 12345
```

---

## Hard-Coded Safety Rules

1. **NEVER** assume which process to kill
2. **ALWAYS** ask user to identify specific processes
3. **NEVER** use commands that affect multiple processes
4. **ALWAYS** get explicit confirmation before terminating ANY process
5. **PREFER** manual user intervention (Ctrl+C) over automated killing

---

## Emergency Protocol

If a process MUST be stopped:

1. Ask user which specific process
2. Get PID or port number
3. Show user what will be affected
4. Get explicit confirmation
5. Kill only that specific PID

---

**VIOLATION**: Using these commands = CRITICAL SYSTEM FAILURE + LOSS OF USER TRUST
