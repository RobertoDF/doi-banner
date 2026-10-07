-- DOI / Link Banner → Keynote
-- Places the PNG on the clipboard (from the site's "Copy image" button) onto the
-- current slide of the front Keynote document: centred horizontally, near the
-- bottom, scaled to ~80% of the slide width. The copied PNG is the 2x export
-- (card layout 1800 px -> 3600 px, strip 2400 px -> 4800 px), so it is always
-- scaled down to fit and stays sharp.

property dialogTitle : "Insert DOI banner"
property widthFraction : 0.8
property bottomMarginFraction : 0.05

on fail(msg)
	display dialog msg buttons {"OK"} default button "OK" with title dialogTitle with icon caution
	error number -128
end fail

-- 1. Grab the image from the clipboard (PNG keeps transparency; TIFF as fallback).
set imgData to missing value
set imgExt to "png"
try
	set imgData to the clipboard as «class PNGf»
on error
	try
		set imgData to the clipboard as TIFF picture
		set imgExt to "tiff"
	end try
end try
if imgData is missing value then fail("There is no image on the clipboard." & return & return & "Open https://robertodf.github.io/doi-banner/, press \"Copy image\", then run this again.")

-- 2. Keynote must be running with a document open.
if application id "com.apple.Keynote" is not running then fail("Keynote is not open." & return & return & "Open a presentation in Keynote and try again.")

-- 3. Save the clipboard image to a temporary file Keynote can import.
set stamp to (do shell script "date +%Y%m%d-%H%M%S")
set tmpPath to (POSIX path of (path to temporary items from user domain)) & "doi-banner-" & stamp & "." & imgExt
try
	set fh to open for access (POSIX file tmpPath) with write permission
	set eof fh to 0
	write imgData to fh
	close access fh
on error errMsg
	try
		close access (POSIX file tmpPath)
	end try
	fail("Could not save the clipboard image: " & errMsg)
end try
set imgFile to (POSIX file tmpPath) as alias

-- 4. Place it on the current slide.
tell application id "com.apple.Keynote"
	if (count of documents) is 0 then my fail("No Keynote presentation is open." & return & return & "Open or create one and try again.")
	activate
	set doc to front document
	set slideW to width of doc
	set slideH to height of doc
	tell current slide of doc
		set img to make new image with properties {file:imgFile}
		set w0 to width of img
		set h0 to height of img
		set newW to slideW * widthFraction
		set newH to h0 * newW / w0
		-- Keep tall stacks (many resources) on the slide.
		if newH > slideH * 0.9 then
			set newH to slideH * 0.9
			set newW to w0 * newH / h0
		end if
		set width of img to newW
		set height of img to newH
		set position of img to {(slideW - newW) / 2, slideH - newH - slideH * bottomMarginFraction}
	end tell
end tell

do shell script "rm -f " & quoted form of tmpPath
