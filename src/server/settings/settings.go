package settings

var (
	tdb  *TDB
	Path string
)

func InitSets(path string, readOnly bool) {
	Path = path
	tdb = NewTDB(path, readOnly)
	loadBTSets()
}

func CloseDB() {
	tdb.CloseDB()
}

func IsReadOnly() bool {
	if tdb == nil || tdb.ReadOnly {
		return true
	}
	return false
}
