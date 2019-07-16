import config from './config';

export const MEDPHARMAVN_API = process.env.NODE_ENV === 'development' ? config.url.api.dev : config.url.api.prod
// export const MEDPHARMAVN_API = config.url.api.local
export const DEFAULT_SMARTFORM_LIMIT = config.config.defaultSmartformLimit

export const LOCALSTORAGE_NAME = config.config.localStorageName

export const GET_ORDERS_LIMIT = config.config.ordersPerPageAndRequestLimit

export const warningColor = config.styles.warningColor
export const successColor = config.styles.successColor
export const errorColor = config.styles.errorColor
export const notActiveColor = config.styles.notActiveColor

export const deliveryCompanies = config.config.deliveryCompanies

export const deliveryTypes = config.config.deliveryTypes

export const DEFAULT_ORDER_LOCK_SECONDS = config.config.defaultLockSeconds

export const APP_TITLE = config.config.appTitle

export const ORDER_DELIVERY_JSON = config.zaslatDeliveryJson

export const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

export const SUMMARY_TYPES = [
    { key: 0, text: "Monthly", value: "Monthly" },
    { key: 1, text: "Yearly", value: "Yearly" },
    { key: 2, text: "Total", value: "Total" },
    { key: 3, text: "Custom", value: "Custom" }
]

export const MONTHS = [
    { key: 0, text: "1", value: "1" },
    { key: 1, text: "2", value: "2" },
    { key: 2, text: "3", value: "3" },
    { key: 3, text: "4", value: "4" },
    { key: 4, text: "5", value: "5" },
    { key: 5, text: "6", value: "6" },
    { key: 6, text: "7", value: "7" },
    { key: 7, text: "8", value: "8" },
    { key: 8, text: "9", value: "9" },
    { key: 9, text: "10", value: "10" },
    { key: 10, text: "11", value: "11" },
    { key: 11, text: "12", value: "12" }
]

export const YEARS = [
    { key: 0, text: "2016", value: "2016" },
    { key: 1, text: "2017", value: "2017" },
    { key: 2, text: "2018", value: "2018" },
    { key: 3, text: "2019", value: "2019" },
]

export const GMAIL = config.gmail;

export const SUPPLIERS = config.suppliers;
export const CONTACT_TYPES = config.contactTypes;
// $files = gci "C:\Users\atran1\Desktop\work\MedpharmaOrdersV2\src" -Recurse -File | ?{$_.Fullname -notlike "*assets*"};$b = 0;foreach($file in $files){$a = Get-content $file.Fullname;$b = $b + $a.length;};$b | clip.exe

// 14.11. 1627
// 24.11. 2040
// 27.11. 2451
// 16.12. 3281
// 27.12. 3892
// 04.02. 4453
// 18.02. 4454
// 04.03  3809
// 12.03  4769
// 22.03  6384
// 25.03  6551
// 10.04  7132
// 11.04  7240
// 17.04  7734
// 22.04  7783
// 29.04  8547
// 30.04  8689
// 19.06  11592
// 25.06  12261