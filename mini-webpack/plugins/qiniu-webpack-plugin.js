const qiniu = require('qiniu')
const path = require('path')

/**
 * 本地打包静态资源上传到七牛云空间
 * accessKey
 * secretKey
 * bucket       七牛云空间名称
 * keyPrefix    文件上传路径
 */
class QiniuWebpackPlugin {
    constructor (options) {
        this.options = options || {}
        this.checkQiniuConfig()
        // 上传凭证之前，我们需要定义好其中鉴权对象mac：
        const { accessKey, secretKey } = this.options.qiniu
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    }

    // 检测七牛云配置
    checkQiniuConfig () {
        const { QINIU_ACCESS_KEY, QINIU_SECRET_KEY, QINIU_BUCKET, QINIU_KEY_PREFIX } = process.env
        if (!this.options.qiniu) {
            this.options.qiniu = {
                accessKey: QINIU_ACCESS_KEY,
                secretKey: QINIU_SECRET_KEY,
                bucket: QINIU_BUCKET,
                keyPrefix: QINIU_KEY_PREFIX || ''
            }
        }
        const { qiniu } = this.options
        if (!qiniu.accessKey || !qiniu.secretKey || !qiniu.bucket) {
            throw new Error('七牛云 Config Invalid!')
        }
    }

    apply (compiler) {
        compiler.hooks.afterEmit.tapPromise('QiniuWebpackPlugin', (compilation) => {
            // console.log(Object.keys(compilation.assets))
            return new Promise((resolve, reject) => {
                // 编译后资源文件
                const assets = Object.keys(compilation.assets)

                // 本地路径
                const localFile = compilation.outputOptions.path

                // 要上传文件数量
                const nUploadCount = assets.length
                const { bucket, keyPrefix } = this.options.qiniu
                let currentUploadedCount = 0

                // 最简单的上传凭证只需要AccessKey，SecretKey和Bucket就可以
                // 自定义凭证有效期（示例2小时，expires单位为秒，为上传凭证的有效时间）
                const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket, expires: 7200 })
                const uploadToken = putPolicy.uploadToken(this.mac)

                // 空间对应的机房 华东:qiniu.zone.Zone_z0|华北:qiniu.zone.Zone_z1|华南:qiniu.zone.Zone_z2|北美:qiniu.zone.Zone_na0
                const config = new qiniu.conf.Config()
                config.zone = qiniu.zone.Zone_z2
                // 文件上传（表单方式） 最简单的就是上传本地文件，直接指定文件的完整路径即可上传
                const formUploader = new qiniu.form_up.FormUploader()
                // 文件上传的路径
                const putExtra = new qiniu.form_up.PutExtra()

                // 全局是否有上传失败标识
                let uploadError = null

                // 遍历编译资源文件
                for (const filename of assets) {
                    const localPath = path.resolve(localFile, filename)
                    // Form 表单文件上传
                    formUploader.putFile(
                        uploadToken,
                        keyPrefix + filename,
                        localPath,
                        putExtra,
                        (err) => {
                            // console.log(`uploade ${filename} result: ${err ? `Error:${err.message}` : 'Success'}`)
                            currentUploadedCount++
                            if (err) {
                                uploadError = err
                            }

                            if (currentUploadedCount === nUploadCount) {
                                uploadError ? reject(uploadError) : resolve()
                            }
                        }
                    )
                }
            })
        })
    }
}

module.exports = QiniuWebpackPlugin
