const express = require("express");
const router = express.Router();
const { getOne } = require('../../models/auth/login.M');
const jwt = require('jsonwebtoken');

router.get("/", async (req, res, next) => {
    res.render('auth/login', {
        title: "Login page",
        header: () => "none",
        cssCs: () => "login/css",
        scriptCs: () => "login/script",
    })
})

// Hàm xử lí lỗi
const handleError = (e) => {
    errs = { userErr: '', passErr: '' };

    // phần lỗi tên đăng nhập
    if (e.message == 'Tên đăng nhập không được để trống') {
        errs.userErr = 'Tên đăng nhập không được để trống';
        return errs;
    }
    if (e.message == 'Kí tự đầu tên đăng nhập không bắt đầu từ kí số') {
        errs.userErr = 'Kí tự đầu tên đăng nhập không bắt đầu từ kí số';
        return errs;
    }
    if (e.message == 'Tên đăng nhập không chứa khoảng trắng') {
        errs.userErr = 'Tên đăng nhập không chứa khoảng trắng';
        return errs;
    }
    if (e.message == 'Tên đăng nhập không tồn tại') {
        errs.userErr = 'Tên đăng nhập không tồn tại';
        return errs;
    }

    // phần lỗi password
    if (e.message == 'Mật khẩu không được để trống') {
        errs.passErr = 'Mật khẩu không được để trống';
        return errs;
    }
    if (e.message == 'Mật không không chính xác') {
        errs.passErr = 'Mật không không chính xác';
        return errs;
    }
    if (e.message == 'Tài khoản đã bị khóa') {
        errs.passErr = 'Tài khoản đã bị vô hiệu';
        return errs;
    }

}

// Tạo token - JWT
const createJWToken = (id, name, role) => {
    // thêm id_user và role_id vào trong token
    const data = {
        id: id,
        username: name,
        role: role,
    };
    return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '24h',
    });
}

// [POST] /dangnhap
router.post('/', async(req, res) => {
    const { uservalue, passvalue, errs } = req.body;
    try {

        if (uservalue === '') {
            throw Error("Tên đăng nhập không được để trống");
        }
        if (errs.userErr != '') {
            throw Error(errs.userErr);
        }
        if (passvalue === '') {
            throw Error("Mật khẩu không được để trống");
        }
        // Kiểm tra tài khoản user đã tồn tại trong db hay chưa
        const dataUser = await getOne('username', uservalue);
        //console.log("userdata:", dataUser);
        if (dataUser.length == 0) {
            throw Error("Tên đăng nhập không tồn tại");
        } 
        else {
            //kiểm tra password 
            //const isPwd = await bcrypt.compare(passvalue, dataUser[0].pwd);
            //console.log(dataUser[0])
            //if (!isPwd) {
            if (passvalue != dataUser[0].pwd) {
                throw Error("Mật không không chính xác");
            }
            else if (dataUser[0].account_status == 0) {
                throw Error("Tài khoản đã bị khóa");
            }

        }

        //tạo token cho client
        const token = createJWToken(dataUser[0].account_id, dataUser[0].username, dataUser[0].role_id);

        // Lưu trữ token ở cookie
        const access_token = `Beaer ${token}`;
        res.cookie('jwt', access_token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).json({ status: 'success', role: dataUser[0].role_id });

    } catch (e) {
        const errs = handleError(e);
        res.status(400).json(errs);
    }
});

module.exports = router;