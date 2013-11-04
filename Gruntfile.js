module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    connect: {
      server: {
        options: {
          port: 4000,
          base: 'build',
          livereload: true
        }
      }
    },

    watch: {
      index: {
        files: 'src/index.html',
        tasks: 'copy:index'
      },
      app: {
        files: 'src/app/*.js',
        tasks: 'neuter:app'
      },
      templates: {
        files: 'src/app/templates/*.hbs',
        tasks: 'emberTemplates'
      },
      scripts: {
        files: ['tmp/app.js', 'tmp/templates.js'],
        tasks: 'concat:app'
      },
      styles: {
        files: 'src/static/styles/*.scss',
        tasks: 'sass:build'
      },
      livereload: {
        files: 'build/**/*',
        options: { livereload: true }
      }
    },

    clean: {
      build: 'build',
      tmp: 'tmp'
    },

    copy: {
      index: {
        src: 'src/index.html',
        dest: 'build/index.html'
      },
      sounds: {
        expand: true,
        cwd: 'src/static/sounds/',
        src: '**',
        dest: 'build/static/sounds/'
      },
      normalize: {
        src: 'bower_components/normalize-css/normalize.css',
        dest: 'bower_components/normalize-css/normalize.scss'
      },
      font_awesome: {
        expand: true,
        cwd: 'bower_components/font-awesome/fonts/',
        src: 'fontawesome-webfont.*',
        dest: 'build/static/fonts/'
      }
    },

    sass: {
      build: {
        files: {
          'build/static/styles.css': 'src/static/styles/styles.scss'
        },
        options: {
          includePaths: ['bower_components']
        }
      }
    },

    neuter: {
      app: {
        src: 'src/app/app.js',
        dest: 'tmp/app.js'
      },
      options: {
        basePath: 'src/app/'
      }
    },

    emberTemplates: {
      compile: {
        files: {
          'tmp/templates.js': 'src/app/templates/**/*.hbs'
        },
        options: {
          templateBasePath: 'src/app/templates/'
        }
      }
    },

    concat: {
      app: {
        src: [
          'bower_components/jquery/jquery.js',
          'bower_components/handlebars/handlebars.runtime.js',
          'bower_components/ember/ember.js',
          //'bower_components/ember-data-shim/ember-data.js',
          'tmp/app.js',
          'tmp/templates.js'
        ],
        dest: 'build/static/app.js'
      }
    }

  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ember-templates');
  grunt.loadNpmTasks('grunt-neuter');

  grunt.registerTask('test', [
    //'jshint'
  ]);

  grunt.registerTask('build', function(target) {
    grunt.task.run([
      'clean:build',
      'copy:index',
      'copy:sounds',
      'copy:normalize',
      'copy:font_awesome',
      'emberTemplates',
      'sass:build',
      'neuter:app',
      'concat:app'
    ]);
    //if (target === 'release') {
    //  grunt.task.run('');
    //}
  });

  grunt.registerTask('release', [
    'build:release',
    'test'
  ]);

  grunt.registerTask('server', function(target) {
    grunt.task.run([
      target === 'release' ? 'build:release' : 'build',
      'connect',
      'watch'
    ]);
  });

  //grunt.registerTask('default', ['jshint', 'test', 'build']);

};
