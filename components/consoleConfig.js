//babel will insert your public ip address here
export const defaultIpAddress = __IP_ADDRESS__; 
export const defaultListenerUrl = `http://${defaultIpAddress}:9000/locations`;
//babel will insert a mac address here
const macAddress = __MAC_ADDRESS__;
import {createHash } from 'crypto';
//access token can be used for a public board
export const companyToken = createHash('md5').update(macAddress).digest("hex").substring(0, 8);
