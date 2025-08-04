import { DateTime } from "luxon"
import path from "path"
import pug from 'pug'


export function exportFeed(evt, events, title = publicSettings.title, link = `${publicSettings.baseurl}/feed/rss`) {

  const opt = {
    zone: publicSettings.instance_timezone,
    locale: publicSettings.instance_locale
  }

  function unixFormat (timestamp: number, format='EEEE d MMMM HH:mm') {
    return DateTime.fromSeconds(timestamp, opt).toFormat(format)
  }

  setHeader(evt, 'Content-Type', 'application/rss+xml; charset=UTF-8')
  return pug.renderFile(path.resolve('./server/utils/rss.pug'), { events, settings: publicSettings, unixFormat, title, link })
}