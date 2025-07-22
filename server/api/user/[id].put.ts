    // // user to modify
    // const user = await User.findByPk(req.body.id)

    // if (!user) { return res.status(404).json({ success: false, message: 'User not found!' }) }

    // if (!req.body.password) { delete req.body.password }

    // if ((!user.is_active && req.body.is_active)) {
    //   mail.send(user.email, 'confirm', { user, config }, res.locals.settings.locale)
    // }

    // await user.update(req.body)
    // res.status(200).send()