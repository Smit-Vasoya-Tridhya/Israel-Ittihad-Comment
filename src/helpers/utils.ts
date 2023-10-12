import { CreateSearchObjectDto } from 'src/common/search_object.dto';
import appMessage from './appMessages.json';
import * as dotenv from 'dotenv';

dotenv.config();

export const returnMessage = (msg: string) => {
    return appMessage[msg];
};

export const permissionArrayToObj = (permissions: []) => {
    return permissions.reduce((result, item: any) => {
        result[item.section] = item.permissions;
        return result;
    }, {});
};

export const getKeywordType = (keyword: any) => {
    if (!isNaN(keyword)) {
        return 'number';
    } else if (Date.parse(keyword)) {
        return 'date';
    } else {
        return 'string';
    }
};

export const paginationObject = (paginationObject: CreateSearchObjectDto) => {
    const page = paginationObject.page || 1;
    const resultPerPage = paginationObject.itemsPerPage || 10;
    const skip = resultPerPage * (page - 1);
    const sortOrder = paginationObject.sortOrder === 'asc' ? 1 : -1;
    const sortField = paginationObject.sortField !== '' ? paginationObject.sortField : 'createdAt';
    const sort = {};
    sort[sortField] = sortOrder;

    return { page, skip, resultPerPage, sort };
};

export const obfuscateEmail = (email: string) => {
    const [localPart, domainPart] = email.split('@');
    const obfuscatedLocalPart = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);
    return `${obfuscatedLocalPart}@${domainPart}`;
};

export const emailTemplate = (message: string, link: string, name: string) => {
    return `<!DOCTYPE html
	PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
	xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
	<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge" />
	<meta name="format-detection" content="date=no" />
	<meta name="format-detection" content="address=no" />
	<meta name="format-detection" content="telephone=no" />
	<meta name="x-apple-disable-message-reformatting" />
	<title>Email Template</title>
	<style type="text/css" media="screen">
		/* Linked Styles */
		body {
			padding: 0 !important;
			margin: 0 !important;
			display: block !important;
			min-width: 100% !important;
			width: 100% !important;
			background: #ffffff;
			-webkit-text-size-adjust: none
		}

		a {
			color: #ffffff;
			text-decoration: none
		}

		p {
			padding: 0 !important;
			margin: 0 !important
		}

		img {
			-ms-interpolation-mode: bicubic;
			/* Allow smoother rendering of resized image in Internet Explorer */
		}

		.m-block {
			display: none !important;
		}

		.mcnPreviewText {
			display: none !important;
			mso-hide: all !important;
		}

		/* Mobile styles */
		@media only screen and (max-device-width: 390px),
		only screen and (max-width: 390px) {
			.mobile-shell {
				width: 100% !important;
				min-width: 100% !important;
			}

			.m-center {
				text-align: center !important;
			}

			.center {
				margin: 0 auto !important;
			}

			.td {
				width: 100% !important;
				min-width: 100% !important;
			}

			.m-td,
			.m-hide {
				display: none !important;
				width: 0 !important;
				height: 0 !important;
				font-size: 0 !important;
				line-height: 0 !important;
				min-height: 0 !important;
			}

			.text {
				padding-left: 10px !important;
				padding-right: 10px !important;
			}

			.m-block {
				display: block !important;
			}

			.m-auto {
				height: auto !important;
			}

			.fluid-img img {
				width: 100% !important;
				max-width: 100% !important;
				height: auto !important;
			}

			.bg {
				-webkit-background-size: cover !important;
				background-size: cover !important;
				background-repeat: none !important;
				background-position: center right !important;
			}

			.text-footer {
				text-align: center !important;
			}
		}
	</style>
</head>

<body class="body"
	style="padding:0 !important; margin:0 !important; display:block !important; min-width:100% !important; width:100% !important; background:#ffffff; -webkit-text-size-adjust:none;">
	<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
		<tr>
			<td align="center" valign="top">
				<!-- Header -->
				<table width="100%" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
					<tr>
						<td align="center">
							<table width="600" border="0" cellspacing="0" cellpadding="0" class="mobile-shell m-hide">
								<tr>
									<td class="td"
										style="width:600px; min-width:600px; font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal;">
										<table width="100%" border="0" cellspacing="0" cellpadding="0">
											<tr>
												<td class="fluid-img"
													style="font-size:0pt; line-height:0pt; text-align:center; padding-top: 15px; padding-bottom: 15px;">
													<a href="#"><img src='${process.env.SERVER_HOST}/public/images/logo-desktop.png'
															width="200" height="46" border="0" alt=""></a>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							<table width="600" border="0" cellspacing="0" cellpadding="0" class="mobile-shell m-block">
								<tr>
									<td class="td"
										style="width:100%; min-width:100%; font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal;">
										<table width="100%" border="0" cellspacing="0" cellpadding="0">
											<tr>
												<td class="fluid-img"
													style="font-size:0pt; line-height:0pt; text-align:center; padding-top: 15px; padding-bottom: 15px; padding-left: 15px; text-align: center;">
													<a href="#"><img src='${process.env.SERVER_HOST}/public/images/logo-mobile.png'
															width="200" height="46" border="0" alt=""></a>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>

				<!-- Content -->
				<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
					<tr>
						<td align="center" class="td"
							style="font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal;">
							<table width="600" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
								<tr>
									<td
										style="padding: 15px 15px 10px; color:#333333; font-family: Arial, Helvetica, sans-serif; font-size:15px; line-height:21px; text-align:left;">
										<strong>Dear ${name},</strong>
									</td>
								</tr>
								${message}
								<tr>
									<td
										style="padding: 15px 15px 10px; color:#333333; font-family: Arial, Helvetica, sans-serif; font-size:15px; line-height:21px; text-align:left;">
										<strong>Warm regards,</strong><br>Israel - Ittihad Comment
										Management,<br>israelhayom.co.il<br>alittihad.ae
									</td>
								</tr>

							</table>
						</td>
					</tr>
				</table>
				<!-- END Content -->
				<!-- Footer -->
				<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
					<tr>
						<td align="center" class="td"
							style="font-size:0pt; line-height:0pt; padding-top:30px; margin:0; font-weight:normal;">
							<table width="600" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
								<tr>
									<td background='${process.env.SERVER_HOST}/public/images/footerbg.jpg' height="36" valign="top" class="bg">
										<!--[if gte mso 9]>
										<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px; height: 36px">
											<v:fill type="frame" src='${process.env.SERVER_HOST}/public/images/footerbg.jpg' />
											<v:textbox inset="0,0,0,0">
										<![endif]-->
										<div>
											<table width="100%" border="0" cellspacing="0" cellpadding="0">
												<tr>
													<td height="36" class="text-footer bg"
														style="color:#ffffff; font-family: Arial,sans-serif; font-size:15px; line-height:20px; text-align:center;">
														<a href='#'
															style="color: #ffffff; text-decoration: none;">Israel -
															Ittihad Comment Management</a>
													</td>
												</tr>
											</table>
										</div>
										<!--[if gte mso 9]>
											</v:textbox>
											</v:rect>
										<![endif]-->
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
				<!-- END Footer -->
			</td>
		</tr>
	</table>
</body>

</html>`;
};

export const transformResponsepagehistorylog = (updatedData: any) => {
    let data = 'Updated Data\n';
    if (updatedData && typeof updatedData === 'string') {
        data += `Data: ${updatedData}\n`;
    }
    if (updatedData.status) {
        data += `Status: ${updatedData.status}\n`;
    }
    if (updatedData.comment) {
        data += `Comment: ${updatedData.comment}\n`;
    }
    if (updatedData.ittihadUrl) {
        data += `Ittihad URL: ${updatedData.ittihadUrl}\n`;
    }
    if (updatedData.isrealUrl) {
        data += `Isreal URL: ${updatedData.isrealUrl}\n`;
    }

    return data;
};

export const transformResponseCommenthistorylog = (updatedData: any) => {
    let data = 'Updated Data\n';
    if (updatedData && typeof updatedData === 'string') {
        data += `Data: ${updatedData}\n`;
    }
    if (updatedData.status) {
        data += `Status: ${updatedData.status}\n`;
    }
    if (updatedData.updatedComment) {
        data += `Comment: ${updatedData.updatedComment}\n`;
    }
    return data;
};

export const capitalizeFirstLetter = (str: any) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
