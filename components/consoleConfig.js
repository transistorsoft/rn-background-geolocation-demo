//babel will insert your public ip address here
export const defaultIpAddress = __IP_ADDRESS__; 
// you can use either local dashboard or the public instance
// export const defaultListenerUrl = `http://${defaultIpAddress}:9000/locations`;
export const defaultListenerUrl = `http://tracker.transistorsoft.com/locations`;
//babel will insert a mac address here
const macAddress = __MAC_ADDRESS__;
import md5 from 'md5';
//access token can be used for a public board
export const companyToken = md5(macAddress).substring(0, 8);
