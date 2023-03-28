on run
  set script_path to POSIX path of (path to me as text)
  set _url to system attribute "OPEN_EID_URL"  
  do shell script "\"" & script_path & "Contents/MacOS/e-id\" \"" & _url & "\" > /dev/null 2>&1 &"
  error number -128
  return
end run
