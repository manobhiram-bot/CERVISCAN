import os

old_ip = "10.178.186.171"
workspace = r"c:\Users\Manobhiram\AndroidStudioProjects\CerviScan"

results = []
for root, dirs, files in os.walk(workspace):
    dirs[:] = [d for d in dirs if d not in (".git", ".gradle", ".idea", ".kotlin", "build", "gradle", "scratch")]
    for file in files:
        if file.endswith((".kt", ".xml", ".properties", ".txt", ".json", ".java")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for i, line in enumerate(f, 1):
                        if old_ip in line:
                            results.append((path, i, line.strip()))
            except Exception as e:
                pass

print(f"Found {len(results)} matches.")
for path, line_no, content in results:
    rel_path = os.path.relpath(path, workspace)
    print(f"{rel_path}:{line_no} -> {content}")
