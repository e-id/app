on open location _url
  set front_app to POSIX path of (path to frontmost application as text)
  set script_path to POSIX path of (path to me as text)
  do shell script "OPEN_EID_APP=\"" & front_app & "\" OPEN_EID_URL=\"" & _url & "\" open -n \"" & script_path & "Contents/MacOS/e-id.app\" > /dev/null 2>&1 &"
  error number -128
end open location

on run
  set script_path to POSIX path of (path to me as text)
  do shell script "open -n \"" & script_path & "Contents/MacOS/e-id.app\" > /dev/null 2>&1 &"
  error number -128
  return
end run
