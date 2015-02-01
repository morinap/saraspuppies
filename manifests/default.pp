package { 'epel-release':
	ensure => present,
}

package { 'nodejs':
	ensure => present,
	require => Package['epel-release'],
}

package { 'npm':
	ensure => present,
	require => Package['nodejs'],
}

exec { '/usr/bin/npm install twit' :
	cwd => "/vagrant",
	user => 'vagrant',
	path => ['/bin', '/usr/bin'],
	require => Package['npm']
}

exec { '/usr/bin/npm install google-images' :
	cwd => "/vagrant",
	user => 'vagrant',
	path => ['/bin', '/usr/bin'],
	require => Package['npm']
}