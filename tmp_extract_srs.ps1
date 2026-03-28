Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() |
  Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
  Select-Object -First 1
$asTaskVoid = [System.WindowsRuntimeSystemExtensions].GetMethods() |
  Where-Object { $_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
  Select-Object -First 1

function Await-Op($op, $resultType) {
  if ($null -eq $resultType) {
    $task = $asTaskVoid.Invoke($null, @($op))
    $task.Wait()
    return $null
  }
  $method = $asTaskGeneric.MakeGenericMethod(@($resultType))
  $task = $method.Invoke($null, @($op))
  $task.Wait()
  return $task.Result
}

$pdfPath = "C:\Ram Sundar's Notes\College Stuff\Sem 6\Software Engineering\SRS DAO Based Taxi App Ram Sundar 23BCE1939.pdf"
$file = Await-Op ([Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]::GetFileFromPathAsync($pdfPath)) ([Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime])
$pdf = Await-Op ([Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType=WindowsRuntime]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType=WindowsRuntime])
$ocr = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]::TryCreateFromUserProfileLanguages()
$renderOptions = [Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType=WindowsRuntime]::new()
$renderOptions.DestinationWidth = 1800

$pageLimit = [Math]::Min(12, $pdf.PageCount)
for ($i = 0; $i -lt $pageLimit; $i++) {
  $page = $pdf.GetPage($i)
  $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]::new()
  Await-Op ($page.RenderToStreamAsync($stream, $renderOptions)) $null
  $stream.Seek(0)
  $decoder = Await-Op ([Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime])
  $bitmap = Await-Op ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime])
  if ($bitmap.BitmapPixelFormat -ne [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8) {
    $bitmap = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime]::Convert($bitmap, [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8)
  }
  $ocrResult = Await-Op ($ocr.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult, Windows.Media.Ocr, ContentType=WindowsRuntime])
  Write-Output ("--- PAGE {0} ---" -f ($i + 1))
  Write-Output $ocrResult.Text
  $page.Dispose()
}
