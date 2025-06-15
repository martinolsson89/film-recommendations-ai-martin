# Rate Limiting Implementation

## Overview
This implementation adds comprehensive rate limiting to protect the authentication endpoints from brute force attacks and other abuse scenarios.

## Features Implemented

### 🔒 **Authentication Endpoint Protection**
- **Login/Register endpoints**: Limited to 5 attempts per 15-minute window per IP
- **Zero queueing**: Failed attempts are rejected immediately (fail-fast approach)
- **IP-based tracking**: Uses client IP address for rate limiting partitions

### 🌐 **Global API Protection**
- **General endpoints**: Limited to 100 requests per minute per IP
- **Queuing support**: Up to 10 requests can be queued for general endpoints

### 📊 **Advanced IP Detection**
- **Proxy support**: Checks `X-Forwarded-For` and `X-Real-IP` headers
- **Load balancer compatible**: Works correctly behind reverse proxies
- **Fallback handling**: Uses connection IP if headers are not available

### 📝 **Security Logging**
- **Failed login attempts**: Logged with email and IP address
- **Registration attempts**: Tracked for security monitoring
- **Successful operations**: Logged for audit purposes

### 📬 **Rate Limit Response Headers**
- **`Retry-After`**: Tells clients when they can try again (15 minutes)
- **`X-RateLimit-Limit`**: Shows the rate limit threshold
- **`X-RateLimit-Remaining`**: Shows remaining requests (0 when blocked)

## Configuration

### Rate Limiting Policies

#### AuthPolicy (Strict)
```csharp
PermitLimit: 5 attempts
Window: 15 minutes
QueueLimit: 0 (no queueing)
```

#### GlobalPolicy (Lenient)
```csharp
PermitLimit: 100 requests
Window: 1 minute
QueueLimit: 10 requests
```

## Security Benefits

✅ **Brute Force Protection**: Prevents automated login attacks
✅ **Account Enumeration Defense**: Limits discovery attempts
✅ **DoS Mitigation**: Protects against request flooding
✅ **Audit Trail**: Comprehensive logging for security analysis
✅ **Proxy-aware**: Works correctly in production environments

## HTTP Status Codes

- **429 Too Many Requests**: Returned when rate limit is exceeded
- **Standard rate limit headers**: Included in responses

## Testing Rate Limits

You can test the rate limiting by making multiple rapid requests to:
- `POST /api/auth/login`
- `POST /api/auth/register`

After 5 attempts within 15 minutes, subsequent requests will return HTTP 429.

## Monitoring

The implementation includes structured logging that can be integrated with:
- Application Insights
- Serilog
- ELK Stack
- Any ASP.NET Core compatible logging provider

## Security Recommendations

1. **Monitor logs**: Watch for repeated failed attempts from specific IPs
2. **Consider additional measures**: For high-risk scenarios, consider:
   - CAPTCHA after multiple failures
   - Account lockout policies
   - Geographic IP filtering
3. **Regular review**: Adjust rate limits based on legitimate usage patterns
