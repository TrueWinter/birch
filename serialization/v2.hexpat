using SearchGroup;
using Input;

struct BSSFile {
    u16 magicNumber;
    u8 fileType;
    u8 fileVersion;
    u32 crc;
    SearchGroup searchGroup;
};

fn strSearchMode(u8 mode) {
    if (mode == 0x00) {
        return "all";
    } else if (mode == 0x01) {
        return "any";
    } else {
        return "<unknown>";
    }
};

fn strSearchType(u8 mode) {
    if (mode == 0x00) {
        return "include";
    } else if (mode == 0x01) {
        return "exclude";
    } else {
        return "<unknown>";
    }
};

fn strInputType(u8 mode) {
    if (mode == 0x00) {
        return "string";
    } else if (mode == 0x01) {
        return "SearchGroup";
    } else {
        return "<unknown>";
    }
};

struct SearchGroup {
    u8 searchMode [[format("strSearchMode"), color("AA00AA")]];
    u8 searchType [[format("strSearchType"), color("AA44AA")]];
    u16 inputsNum [[color("0044AA")]];
    Input input[inputsNum];
};

struct Input {
    u8 inputType [[format("strInputType"), color("00AA00")]];
    if (inputType == 0x00) {
        u16 size [[color("00AAAA")]];
        char input[size] [[color("AAAAAA")]];
    } else {
        SearchGroup inputs;
    }
};

BSSFile bssfile @ 0x00;