on open location open_URL
  set front_app to POSIX path of (path to frontmost application as text)
  set script_path to POSIX path of (path to me as text)
  do shell script "export OPEN_EID_APP=\"" & front_app & "\" ; \"" & script_path & "Contents/MacOS/e-id\" \"" & open_URL & "\""
end open location

set script_path to POSIX path of (path to me as text)
do shell script "\"" & script_path & "Contents/MacOS/e-id\""