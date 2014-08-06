<?php
/*if ($_POST) {
	$img = $_POST['image'];
	$img = str_replace('data:image/jpeg;base64,', '', $img);
	$img = str_replace(' ', '+', $img);
	$data = base64_decode($img);
	$file = uniqid().'.jpg';
	$success = file_put_contents($file, $data);
}*/


define('UPLOAD_DIR', __DIR__.DIRECTORY_SEPARATOR.'upload'.DIRECTORY_SEPARATOR);

if(is_array($_FILES['filesToUpload']['tmp_name']))
{
	foreach($_FILES['filesToUpload']['tmp_name'] as $file)
	{
		move_uploaded_file($file, UPLOAD_DIR.uniqid().'_'.rand(0, 100).'.jpg');
	}
}
else
{
	move_uploaded_file($_FILES['filesToUpload']['tmp_name'], UPLOAD_DIR.uniqid().'_'.rand(0, 100).'.jpg');
}