#!/usr/bin/env bun

// import packlist from 'npm-packlist'
// import tar from 'tar'
import fs from 'fs'
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
// console.error(pkg)
// console.error(process.cwd())
// const files = await packlist({ path: process.cwd() })

// console.error(files)
// await tar.create(
//   {
//     gzip: true,
//     file: `${pkg.name}-${pkg.version}.tgz`,
//     cwd: process.cwd(),
//     portable: true
//   },
//   files
// )

// console.log(`Created ${pkg.name}-${pkg.version}.tgz`)

import Arborist from '@npmcli/arborist'
const packlist = require('npm-packlist')
const tar = require('tar')
const packageDir = '.'
const packageTarball = './releases/package.tgz'

const arborist = new Arborist({ path: packageDir })
arborist.loadActual().then((tree) => {
  packlist(tree)
    .then(files => tar.create({
      prefix: 'package/',
      cwd: packageDir,
      file: packageTarball,
      gzip: true
    }, files))
    .then(_ => {
      console.log(`Created ${pkg.name}-${pkg.version}.tgz`)
      // tarball has been created, continue with your day
    })
  })
