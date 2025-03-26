package constants

// HTTP Status Messages
const (
	MsgSuccess             = "Success"
	MsgBadRequest          = "Bad Request"
	MsgUnauthorized        = "Unauthorized"
	MsgInternalServerError = "Internal Server Error"
	MsgNotFound            = "Not Found"
)

// Nightscout API
const (
	NightscoutAPIStatusEndpoint  = "/api/v1/status.json"
	NightscoutAPIEntriesEndpoint = "/api/v1/entries.json"
	DefaultEntriesCount          = 24
)

// Firebase Collections
const (
	UserConnectionsCollection = "userConnections"
)

// Field names in Firebase
const (
	FieldNightscoutURL    = "nightscoutUrl"
	FieldNightscoutAPIKey = "nightscoutApiKey"
	FieldConnected        = "connected"
	FieldLastUpdated      = "lastUpdated"
)

// Query param names
const (
	ParamUserID = "userId"
	ParamCount  = "count"
	ParamFrom   = "from"
	ParamTo     = "to"
)

// Error messages
const (
	ErrMsgUserIDRequired       = "userId is required"
	ErrMsgConnectionFailed     = "Failed to connect to Nightscout"
	ErrMsgSaveConnectionFailed = "Failed to save connection"
	ErrMsgGetConnectionFailed  = "Failed to get connection details"
	ErrMsgFetchEntriesFailed   = "Failed to fetch entries"
	ErrMsgDisconnectFailed     = "Failed to disconnect from Nightscout"
)
