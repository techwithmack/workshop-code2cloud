# Opengrep Playground — Command Injection Rule

Opengrep is a drop-in, open-source fork of Semgrep, so it uses the same rule syntax. You can paste the rule and the code below directly into the [Opengrep Playground](https://playground.opengrep.dev/) — put the rule in the left pane and the code in the right pane to see it trigger.

## The rule

Detects Node.js code that passes unsanitized, user-controlled input into `child_process.exec()`, a classic command injection sink.

```yaml
rules:
  - id: node-child-process-exec-injection
    languages: [javascript, typescript]
    severity: ERROR
    message: >
      User input is passed to `child_process.exec()`, which runs it through a shell.
      An attacker who controls this input can inject arbitrary shell commands.
      Use `child_process.execFile()` or `spawn()` with an argument array instead,
      which does not invoke a shell.
    metadata:
      cwe: "CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')"
      owasp: "A03:2021 - Injection"
      category: security
      references:
        - https://owasp.org/www-community/attacks/Command_Injection
    patterns:
      - pattern-either:
          - pattern: $CP.exec($CMD, ...)
          - pattern: exec($CMD, ...)
      - pattern-not: $CP.exec("...", ...)
      - pattern-not: exec("...", ...)
```

## Code that should trigger it

```javascript
const express = require("express");
const { exec } = require("child_process");
const app = express();

app.get("/ping", (req, res) => {
  const host = req.query.host; // attacker-controlled
  const cmd = `ping -c 4 ${host}`;

  // Vulnerable: host could be "8.8.8.8; rm -rf /"
  exec(cmd, (err, stdout) => {
    res.send(stdout);
  });
});
```

## Code that should NOT trigger it

```javascript
const { execFile } = require("child_process");

app.get("/ping", (req, res) => {
  const host = req.query.host;

  // Safe: no shell involved, args passed as an array
  execFile("ping", ["-c", "4", host], (err, stdout) => {
    res.send(stdout);
  });
});

// Also safe: exec() called with a hardcoded, literal command
exec("uptime", (err, stdout) => console.log(stdout));
```

## How to use this in the Opengrep Playground

1. Go to the Opengrep Playground.
2. Paste the YAML under **Rule** into the rule editor.
3. Paste the "should trigger" snippet into the **Test Code** pane — you should see a finding highlighted on the `exec($CMD, ...)` line.
4. Swap in the "should NOT trigger" snippet — the finding should disappear, since `pattern-not` excludes literal, hardcoded command strings.
5. Try tweaking the rule (e.g. remove `pattern-not`) and see how the matches change — this is the fastest way to understand how `pattern`, `pattern-either`, and `pattern-not` combine.
