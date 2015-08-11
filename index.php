<?php

	if ($_POST || $_FILES)
	{
		sleep(2);

		$file = $_FILES['myfile'];
		if (!is_uploaded_file($file['tmp_name']))
		{
			header("HTTP/1.0 400 Bad Request");
			exit;
		}

		$filename = rand(1, 100000) . '-' .  $file['name'];
		$destination = dirname(__FILE__) . DIRECTORY_SEPARATOR . $filename;

		if (!move_uploaded_file($file['tmp_name'], $destination))
		{
			header("HTTP/1.0 500", 500);
			exit;
		}

		header("content-type: application/json;  charset=utf-8");
		echo sprintf('{ "path": "%s" }', $filename);
		// print_r($_POST);
		// print_r($_FILES);
		exit;
	}


 ?><!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Document</title>
	<style>
		#log {
			color: red;
		}

		#demo {
			width: 500px;
			height: 200px;
			box-sizing: border-box;
			background: #F7F7F7;
			border: 1px solid #000;
			border-radius: 5px;
			margin:0 auto;
		}

		.hack a,
		.hack a:visited {
			color: #1D8DA4;
			text-decoration: none;
			position: relative;
			overflow: hidden;
			display: inline-block;
		}

		.hack a span{
			position: relative;
			display: block;
		}

		.hack a input[type=file] {
			position: absolute;
			top: 0;
			right: 0;
			margin: 0;
			opacity: 0;
			font-size: 200px;
		}


		.hack a:hover {
			text-decoration: underline;
		}

		#report {
			display: block;
		}

		#report.success {
			color: green;
		}

		#report.error {
			color: red;
		}

	</style>
</head>
<body>

<div id="demo">

	<table id="image-ui-component">
		<tr>
			<td>
				<img id="image-placeholder" src="placeholder-300x300.png" style="width: 80px; height: auto;">
			</td>
			<td>
				<div class="hack">
					<a href="#">
						<span>Atualizar foto do perfil</span>
						<input type="file" id="myfile" name="myfile" data-file-upload>
					</a>
				</div>
			</td>
		</tr>

		<tr>
			<td colspan="2">
				<span id="report" class=""></span>
			</td>
		</tr>
	</table>

</div>


	<script type="text/javascript" src="jquery-2.1.4.js"></script>
	<script type="text/javascript" src="avatar-image-upload-callback.js"></script>

	<script type="text/javascript">

		var MAX_FILE_SIZE_EXCEEDED = 2 * 1024 * 1024;

		function humanize_file_size( bytes )
		{
			var kbyte = 1024;
			var mbyte = kbyte * 1024;

			// format to mbyte
			if (bytes >= mbyte)
			{
				return (bytes / mbyte).toFixed(1).replace(".", ",") + "Mb";
			}
			// format to kbyte
			else
			{
				return (bytes / kbyte).toFixed(1).replace(".", ",")	 + "Kb";
			}
		}

		$(function()
		{
			var $report = $("#report");

			var opt = {
				ajax_settings: {
					url: "index.php",
					method: "POST",
            		debug: true,
				},
				callbacks: {
					success: function( data ) {
						handle_success( data );
					},
					fail: function() {
						handle_fail();
					},
					sending: function() {
						handle_sending();
					}
				}
			}

			try {
				$("[data-file-upload]").imageUploader( opt );
			}
			catch(e) {
				console.error("Ops! ", e);
			}

			function handle_fail( response )
			{
				switch( response.error )
				{
					case "MAX_FILE_SIZE_EXCEEDED":
						$report
							.removeClass("success")
							.addClass("error")
							.text("Arquivo excedeu o limite de tamanho, o limite é: " + humanize_file_size( MAX_FILE_SIZE_EXCEEDED ) );
					break;
					case "FILE_TYPE_NOT_ALLOWED":
						$report
							.removeClass("success")
							.addClass("error")
							.text("O arquivo deve ser uma imagem, ex: png, jpg.");
					break;
					case "UNKOWN_ERROR":
					break;
				}
			}

			function handle_sending( response )
			{
				$report
					.removeClass("error")
					.addClass("success")
					.text("Aguarde..." );
			}

			function handle_success( response )
			{
				$("#image-placeholder").hide();
	            $("#image-placeholder").attr("src", response.path);
	            $("#image-placeholder").fadeIn();

				$report
					.removeClass("error")
					.addClass("success")
					.text("Imagem enviado com sucesso!");
			}
		});


	</script>
</body>
</html>